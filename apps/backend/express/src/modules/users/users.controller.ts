import { Router } from 'express';
import type { User } from '@common/model';
import { createToken } from '../../utils/jwt';
import { checkPassword, hashPassword } from '../../utils/password';

export const usersRouter: Router = Router();

const users: Array<User & { id: number; passwordHash: string }> = [];

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

  return res.json({
    user: {
      email: user.email,
      token,
      username: user.username,
      bio: user.bio,
      image: user.image,
    },
  });
});
