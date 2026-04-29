import { Router } from 'express';

export const articlesRouter: Router = Router();

articlesRouter.get('/', (_req, res) => {
  return res.json({
    articles: [],
    articlesCount: 0,
  });
});
