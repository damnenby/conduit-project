import { Router } from 'express';
import type { Article, Comment } from '@common/model';

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
    favorited: false,
    favoritesCount: 0,
    author: {
      username: 'demo',
      bio: null,
      image: null,
      following: false,
    },
  },
];

const comments: Comment[] = [
  {
    id: 1,
    body: 'This is a first example comment.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: {
      username: 'demo',
      bio: null,
      image: null,
      following: false,
    },
  },
];

articlesRouter.get('/', (req, res) => {
  const tag = req.query.tag?.toString();
  const author = req.query.author?.toString();

  let filteredArticles = articles;

  if (tag) {
    filteredArticles = filteredArticles.filter((article) =>
      article.tagList.includes(tag),
    );
  }

  if (author) {
    filteredArticles = filteredArticles.filter(
      (article) => article.author.username === author,
    );
  }

  return res.json({
    articles: filteredArticles,
    articlesCount: filteredArticles.length,
  });
});

articlesRouter.get('/:slug', (req, res) => {
  const article = articles.find((item) => item.slug === req.params.slug);

  if (!article) {
    return res.status(404).json({
      errors: {
        body: ['Article not found'],
      },
    });
  }

  return res.json({ article });
});

articlesRouter.get('/:slug/comments', (req, res) => {
  const article = articles.find((item) => item.slug === req.params.slug);

  if (!article) {
    return res.status(404).json({
      errors: {
        body: ['Article not found'],
      },
    });
  }

  return res.json({ comments });
});
