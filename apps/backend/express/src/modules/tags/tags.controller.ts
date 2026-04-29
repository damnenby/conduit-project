import { Router } from 'express';

export const tagsRouter: Router = Router();

const tags = ['intro'];

tagsRouter.get('/', (_req, res) => {
  return res.json({ tags });
});
