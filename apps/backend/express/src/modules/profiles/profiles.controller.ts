import { Router } from 'express';
import type { Profile } from '@common/model';
import { prisma } from '../../db/prisma';
import { requireAuth, type AuthRequest } from '../../middleware/auth';

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
  const username = String(req.params.username);
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  });
  const profile =
    user === null
      ? profiles.find((item) => item.username === username)
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

profilesRouter.post('/:username/follow', requireAuth, async (req, res) => {
  const authReq = req as AuthRequest;
  const currentUserId = authReq.userId;
  const username = String(req.params.username);
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (user && user.id === currentUserId) {
    return res.status(422).json({
      errors: {
        body: ['You cannot follow yourself'],
      },
    });
  }

  if (user && currentUserId) {
    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: user.id,
        },
      },
      update: {},
      create: {
        followerId: currentUserId,
        followingId: user.id,
      },
    });

    return res.json({
      profile: {
        username: user.username,
        bio: user.bio,
        image: user.image,
        following: true,
      },
    });
  }

  const profile = profiles.find((item) => item.username === username);

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

profilesRouter.delete('/:username/follow', requireAuth, async (req, res) => {
  const authReq = req as AuthRequest;
  const currentUserId = authReq.userId;
  const username = String(req.params.username);
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (user && currentUserId) {
    await prisma.follow.deleteMany({
      where: {
        followerId: currentUserId,
        followingId: user.id,
      },
    });

    return res.json({
      profile: {
        username: user.username,
        bio: user.bio,
        image: user.image,
        following: false,
      },
    });
  }

  const profile = profiles.find((item) => item.username === username);

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
