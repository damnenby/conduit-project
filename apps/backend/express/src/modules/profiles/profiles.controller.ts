import { Router } from 'express';
import type { Profile } from '@common/model';
import { prisma } from '../../db/prisma';
import { requireAuth } from '../../middleware/auth';

export const profilesRouter: Router = Router();

const profiles: Profile[] = [
  {
    username: 'demo',
    bio: null,
    image: null,
    following: false,
  },
];

profilesRouter.get('/:username', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: {
      username: req.params.username,
    },
  });
  const profile =
    user === null
      ? profiles.find((item) => item.username === req.params.username)
      : {
          username: user.username,
          bio: user.bio,
          image: user.image,
          following: false,
        };

  if (!profile) {
    return res.status(404).json({
      errors: {
        body: ['Profile not found'],
      },
    });
  }

  return res.json({ profile });
});

profilesRouter.post('/:username/follow', requireAuth, (req, res) => {
  const profile = profiles.find((item) => item.username === req.params.username);

  if (!profile) {
    return res.status(404).json({
      errors: {
        body: ['Profile not found'],
      },
    });
  }

  profile.following = true;

  return res.json({ profile });
});

profilesRouter.delete('/:username/follow', requireAuth, (req, res) => {
  const profile = profiles.find((item) => item.username === req.params.username);

  if (!profile) {
    return res.status(404).json({
      errors: {
        body: ['Profile not found'],
      },
    });
  }

  profile.following = false;

  return res.json({ profile });
});
