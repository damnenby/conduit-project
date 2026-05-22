import { Router } from 'express';
import { prisma } from '../../db/prisma';
import { optionalAuth, requireAuth, type AuthRequest } from '../../middleware/auth';

export const profilesRouter: Router = Router();

profilesRouter.get('/:username', optionalAuth, async (req, res) => {
  const authReq = req as AuthRequest;
  const currentUserId = authReq.userId;
  const username = String(req.params.username);
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  let following = false;

  if (!user) {
    return res.status(404).json({
      errors: {
        body: ['Profile not found'],
      },
    });
  }

  if (currentUserId) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: user.id,
        },
      },
    });

    following = Boolean(follow);
  }

  return res.json({
    profile: {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following,
    },
  });
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

  if (!user) {
    return res.status(404).json({
      errors: {
        body: ['Profile not found'],
      },
    });
  }

  if (!currentUserId) {
    return res.status(401).json({
      errors: {
        body: ['Authorization token is invalid'],
      },
    });
  }

  if (user.id === currentUserId) {
    return res.status(422).json({
      errors: {
        body: ['You cannot follow yourself'],
      },
    });
  }

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

  if (!user) {
    return res.status(404).json({
      errors: {
        body: ['Profile not found'],
      },
    });
  }

  if (!currentUserId) {
    return res.status(401).json({
      errors: {
        body: ['Authorization token is invalid'],
      },
    });
  }

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
});
