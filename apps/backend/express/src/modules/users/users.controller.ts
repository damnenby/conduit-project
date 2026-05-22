import { Router, type Response } from 'express';
import { prisma } from '../../db/prisma';
import { requireAuth, type AuthRequest } from '../../middleware/auth';
import { createToken } from '../../utils/jwt';
import { checkPassword, hashPassword } from '../../utils/password';

export const usersRouter: Router = Router();
export const currentUserRouter: Router = Router();

type StoredUser = {
  id: number;
  email: string;
  username: string;
  bio: string | null;
  image: string | null;
  passwordHash: string;
};

export const findUserById = (id: number | undefined) => {
  if (!id) return null;

  return prisma.user.findUnique({
    where: { id },
  });
};

const sendUser = (res: Response, user: StoredUser) => {
  return res.json({
    user: {
      email: user.email,
      token: createToken(user.id),
      username: user.username,
      bio: user.bio,
      image: user.image,
    },
  });
};

usersRouter.post('/', async (req, res) => {
  const username =
    typeof req.body?.user?.username === 'string'
      ? req.body.user.username.trim()
      : '';
  const email =
    typeof req.body?.user?.email === 'string'
      ? req.body.user.email.trim().toLowerCase()
      : '';
  const password =
    typeof req.body?.user?.password === 'string' ? req.body.user.password : '';

  if (!username || !email || !password) {
    return res.status(422).json({
      errors: {
        body: ['Username, email and password are required'],
      },
    });
  }

  if (password.length < 8) {
    return res.status(422).json({
      errors: {
        body: ['Password must be at least 8 characters long'],
      },
    });
  }

  if (await prisma.user.findUnique({ where: { email } })) {
    return res.status(422).json({
      errors: {
        body: ['Email is already used'],
      },
    });
  }

  if (await prisma.user.findUnique({ where: { username } })) {
    return res.status(422).json({
      errors: {
        body: ['Username is already used'],
      },
    });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      username,
      bio: null,
      image: null,
      passwordHash,
    },
  });

  return res.status(201).json({
    user: {
      email: user.email,
      token: createToken(user.id),
      username: user.username,
      bio: user.bio,
      image: user.image,
    },
  });
});

usersRouter.post('/login', async (req, res) => {
  const email =
    typeof req.body?.user?.email === 'string'
      ? req.body.user.email.trim().toLowerCase()
      : '';
  const password =
    typeof req.body?.user?.password === 'string' ? req.body.user.password : '';

  if (!email || !password) {
    return res.status(422).json({
      errors: {
        body: ['Email and password are required'],
      },
    });
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !(await checkPassword(password, user.passwordHash))) {
    return res.status(401).json({
      errors: {
        body: ['Email or password is wrong'],
      },
    });
  }

  return sendUser(res, user);
});

currentUserRouter.get('/', requireAuth, async (req, res) => {
  const authReq = req as AuthRequest;
  const user = await findUserById(authReq.userId);

  if (!user) {
    return res.status(404).json({
      errors: {
        body: ['User not found'],
      },
    });
  }

  return sendUser(res, user);
});

currentUserRouter.put('/', requireAuth, async (req, res) => {
  const authReq = req as AuthRequest;
  const user = await findUserById(authReq.userId);

  if (!user) {
    return res.status(404).json({
      errors: {
        body: ['User not found'],
      },
    });
  }

  const usernameInput = req.body?.user?.username;
  const emailInput = req.body?.user?.email;
  const passwordInput = req.body?.user?.password;
  const bioInput = req.body?.user?.bio;
  const imageInput = req.body?.user?.image;

  if (
    usernameInput === undefined &&
    emailInput === undefined &&
    passwordInput === undefined &&
    bioInput === undefined &&
    imageInput === undefined
  ) {
    return res.status(422).json({
      errors: {
        body: ['At least one field is required'],
      },
    });
  }

  if (emailInput !== undefined && typeof emailInput !== 'string') {
    return res.status(422).json({
      errors: {
        body: ['Email must be text'],
      },
    });
  }

  if (usernameInput !== undefined && typeof usernameInput !== 'string') {
    return res.status(422).json({
      errors: {
        body: ['Username must be text'],
      },
    });
  }

  if (passwordInput !== undefined && typeof passwordInput !== 'string') {
    return res.status(422).json({
      errors: {
        body: ['Password must be text'],
      },
    });
  }

  if (
    bioInput !== undefined &&
    bioInput !== null &&
    typeof bioInput !== 'string'
  ) {
    return res.status(422).json({
      errors: {
        body: ['Bio must be text'],
      },
    });
  }

  if (
    imageInput !== undefined &&
    imageInput !== null &&
    typeof imageInput !== 'string'
  ) {
    return res.status(422).json({
      errors: {
        body: ['Image must be text'],
      },
    });
  }

  const email =
    emailInput !== undefined ? emailInput.trim().toLowerCase() : undefined;
  const username =
    usernameInput !== undefined ? usernameInput.trim() : undefined;
  const password = passwordInput;
  const bio = bioInput === undefined ? undefined : bioInput?.trim() || null;
  const image =
    imageInput === undefined ? undefined : imageInput?.trim() || null;

  if (email !== undefined && !email) {
    return res.status(422).json({
      errors: {
        body: ['Email cannot be empty'],
      },
    });
  }

  if (username !== undefined && !username) {
    return res.status(422).json({
      errors: {
        body: ['Username cannot be empty'],
      },
    });
  }

  if (password !== undefined && password.length < 8) {
    return res.status(422).json({
      errors: {
        body: ['Password must be at least 8 characters long'],
      },
    });
  }

  const existingEmailUser =
    email !== undefined
      ? await prisma.user.findUnique({ where: { email } })
      : null;

  if (existingEmailUser && existingEmailUser.id !== user.id) {
    return res.status(422).json({
      errors: {
        body: ['Email is already used'],
      },
    });
  }

  const existingUsernameUser =
    username !== undefined
      ? await prisma.user.findUnique({ where: { username } })
      : null;

  if (existingUsernameUser && existingUsernameUser.id !== user.id) {
    return res.status(422).json({
      errors: {
        body: ['Username is already used'],
      },
    });
  }

  const updateData: {
    email?: string;
    username?: string;
    bio?: string | null;
    image?: string | null;
    passwordHash?: string;
  } = {};

  if (email !== undefined) updateData.email = email;
  if (username !== undefined) updateData.username = username;
  if (bio !== undefined) updateData.bio = bio || null;
  if (image !== undefined) updateData.image = image || null;
  if (password !== undefined) updateData.passwordHash = await hashPassword(password);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });

  return sendUser(res, updatedUser);
});
