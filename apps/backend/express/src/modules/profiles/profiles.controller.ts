import { Router } from 'express';
import type { Profile } from '@common/model';

export const profilesRouter: Router = Router();

const profiles: Profile[] = [
  {
    username: 'demo',
    bio: null,
    image: null,
    following: false,
  },
];

profilesRouter.get('/:username', (req, res) => {
  const profile = profiles.find((item) => item.username === req.params.username);

  if (!profile) {
    return res.status(404).json({
      errors: {
        body: ['Profile not found'],
      },
    });
  }

  return res.json({ profile });
});

profilesRouter.post('/:username/follow', (req, res) => {
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

profilesRouter.delete('/:username/follow', (req, res) => {
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
