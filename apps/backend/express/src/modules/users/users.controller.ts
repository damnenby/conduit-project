import { Router, type Response } from 'express';
import type { User } from '@common/model';
import { requireAuth, type AuthRequest } from '../../middleware/auth';
import { createToken } from '../../utils/jwt';
import { checkPassword, hashPassword } from '../../utils/password';

export const usersRouter: Router = Router();
export const currentUserRouter: Router = Router();

type StoredUser = User & { id: number; passwordHash: string };

const users: StoredUser[] = [];

export const findUserById = (id: number | undefined) => {
  return users.find((item) => item.id === id);
};

const sendUser = (res: Response, user: User) => {
  return res.json({
    user: {
      email: user.email,
      token: user.token,
      username: user.username,
      bio: user.bio,
      image: user.image,
    },
  });
};

usersRouter.post('/', async (req, res) => {
  const username = req.body?.user?.username;
  const email = req.body?.user?.email;
  const password = req.body?.user?.password;

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

  if (users.some((item) => item.email === email)) {
    return res.status(422).json({
      errors: {
        body: ['Email is already used'],
      },
    });
  }

  if (users.some((item) => item.username === username)) {
    return res.status(422).json({
      errors: {
        body: ['Username is already used'],
      },
    });
  }

  const id = users.length + 1;
  const passwordHash = await hashPassword(password);
  const token = createToken(id);

  const user = {
    id,
    email,
    token,
    username,
    bio: null,
    image: null,
    passwordHash,
  };

  users.push(user);

  return res.status(201).json({
    user: {
      email: user.email,
      token: user.token,
      username: user.username,
      bio: user.bio,
      image: user.image,
    },
  });
});

usersRouter.post('/login', async (req, res) => {
  const email = req.body?.user?.email;
  const password = req.body?.user?.password;

  if (!email || !password) {
    return res.status(422).json({
      errors: {
        body: ['Email and password are required'],
      },
    });
  }

  const user = users.find((item) => item.email === email);

  if (!user || !(await checkPassword(password, user.passwordHash))) {
    return res.status(401).json({
      errors: {
        body: ['Email or password is wrong'],
      },
    });
  }

  const token = createToken(user.id);
  user.token = token;

  return sendUser(res, user);
});

currentUserRouter.get('/', requireAuth, (req, res) => {
  const authReq = req as AuthRequest;
  const user = users.find((item) => item.id === authReq.userId);

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
  const user = users.find((item) => item.id === authReq.userId);

  if (!user) {
    return res.status(404).json({
      errors: {
        body: ['User not found'],
      },
    });
  }

  const username = req.body?.user?.username;
  const email = req.body?.user?.email;
  const password = req.body?.user?.password;
  const bio = req.body?.user?.bio;
  const image = req.body?.user?.image;

  if (
    username === undefined &&
    email === undefined &&
    password === undefined &&
    bio === undefined &&
    image === undefined
  ) {
    return res.status(422).json({
      errors: {
        body: ['At least one field is required'],
      },
    });
  }

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

  if (email !== undefined && users.some((item) => item.email === email && item.id !== user.id)) {
    return res.status(422).json({
      errors: {
        body: ['Email is already used'],
      },
    });
  }

  if (username !== undefined && users.some((item) => item.username === username && item.id !== user.id)) {
    return res.status(422).json({
      errors: {
        body: ['Username is already used'],
      },
    });
  }

  if (email !== undefined) user.email = email;
  if (username !== undefined) user.username = username;
  if (bio !== undefined) user.bio = bio || null;
  if (image !== undefined) user.image = image || null;
  if (password !== undefined) user.passwordHash = await hashPassword(password);

  return sendUser(res, user);
});
