import { Router } from 'express';
import type { Article, Comment } from '@common/model';
import { requireAuth, type AuthRequest } from '../../middleware/auth';
import { findUserById } from '../users/users.controller';

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

const slugify = (title: string) => {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'article'
  );
};

const createSlug = (title: string) => {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let suffix = 2;

  while (articles.some((article) => article.slug === slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
};

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

articlesRouter.post('/', requireAuth, (req, res) => {
  const authReq = req as AuthRequest;
  const user = findUserById(authReq.userId);
  const title =
    typeof req.body?.article?.title === 'string'
      ? req.body.article.title.trim()
      : '';
  const description =
    typeof req.body?.article?.description === 'string'
      ? req.body.article.description.trim()
      : '';
  const body =
    typeof req.body?.article?.body === 'string'
      ? req.body.article.body.trim()
      : '';
  const tagList = Array.isArray(req.body?.article?.tagList)
    ? req.body.article.tagList
        .filter((tag: unknown) => typeof tag === 'string')
        .map((tag: string) => tag.trim())
        .filter(Boolean)
    : [];

  if (!user) {
    return res.status(404).json({
      errors: {
        body: ['User not found'],
      },
    });
  }

  if (!title || !description || !body) {
    return res.status(422).json({
      errors: {
        body: ['Title, description and body are required'],
      },
    });
  }

  const now = new Date().toISOString();
  const article: Article = {
    slug: createSlug(title),
    title,
    description,
    body,
    tagList,
    createdAt: now,
    updatedAt: now,
    favorited: false,
    favoritesCount: 0,
    author: {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following: false,
    },
  };

  articles.unshift(article);

  return res.status(201).json({ article });
});

articlesRouter.get('/feed', requireAuth, (_req, res) => {
  const feedArticles = articles.filter((article) => article.author.following);

  return res.json({
    articles: feedArticles,
    articlesCount: feedArticles.length,
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

articlesRouter.post('/:slug/favorite', requireAuth, (req, res) => {
  const article = articles.find((item) => item.slug === req.params.slug);

  if (!article) {
    return res.status(404).json({
      errors: {
        body: ['Article not found'],
      },
    });
  }

  if (!article.favorited) {
    article.favorited = true;
    article.favoritesCount += 1;
  }

  return res.json({ article });
});

articlesRouter.delete('/:slug/favorite', requireAuth, (req, res) => {
  const article = articles.find((item) => item.slug === req.params.slug);

  if (!article) {
    return res.status(404).json({
      errors: {
        body: ['Article not found'],
      },
    });
  }

  if (article.favorited) {
    article.favorited = false;
    article.favoritesCount -= 1;
  }

  return res.json({ article });
});
