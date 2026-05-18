import { Router } from 'express';
import { listTags } from '../articles/articles.controller';

export const tagsRouter: Router = Router();

tagsRouter.get('/', (_req, res) => {
  return res.json({ tags: listTags() });
});
