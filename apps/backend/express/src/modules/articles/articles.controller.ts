import { Router } from 'express';
import type { Article } from '@common/model';

export const articlesRouter: Router = Router();

const articles: Article[] = [
  {
    slug: 'first-conduit-article',
    title: 'First Conduit Article',
    description: 'This is a first example article.',
    body: 'This article is here for testing the new articles endpoint.',
    tagList: ['intro'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    favoritesCount: 0,
  },
];

articlesRouter.get('/', (_req, res) => {
  return res.json({
    articles,
    articlesCount: articles.length,
  });
});
