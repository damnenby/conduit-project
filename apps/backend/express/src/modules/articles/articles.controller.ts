import { Router } from 'express';
import type { Article, Comment } from '@common/model';
import { requireAuth, type AuthRequest } from '../../middleware/auth';
import { findUserById } from '../users/users.controller';

export const articlesRouter: Router = Router();

type StoredComment = Comment & { articleSlug: string };

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

const comments: StoredComment[] = [
  {
    id: 1,
    articleSlug: 'first-conduit-article',
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

const createSlug = (title: string, currentSlug?: string) => {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let suffix = 2;

  while (
    articles.some((article) => article.slug === slug && article.slug !== currentSlug)
  ) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
};

export const listTags = () => {
  return Array.from(
    new Set(articles.flatMap((article) => article.tagList)),
  ).sort();
};

const sortNewestFirst = (items: Article[]) => {
  return [...items].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
};

articlesRouter.get('/', (req, res) => {
  const tag = req.query.tag?.toString();
  const author = req.query.author?.toString();
  const favorited = req.query.favorited?.toString();
  const limit = Number(req.query.limit ?? 20);
  const offset = Number(req.query.offset ?? 0);

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

  if (favorited) {
    filteredArticles = filteredArticles.filter((article) => article.favorited);
  }

  filteredArticles = sortNewestFirst(filteredArticles);

  const articlesCount = filteredArticles.length;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 20;
  const safeOffset = Number.isFinite(offset) && offset > 0 ? offset : 0;

  return res.json({
    articles: filteredArticles.slice(safeOffset, safeOffset + safeLimit),
    articlesCount,
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

articlesRouter.put('/:slug', requireAuth, (req, res) => {
  const authReq = req as AuthRequest;
  const user = findUserById(authReq.userId);
  const article = articles.find((item) => item.slug === req.params.slug);

  if (!user) {
    return res.status(404).json({
      errors: {
        body: ['User not found'],
      },
    });
  }

  if (!article) {
    return res.status(404).json({
      errors: {
        body: ['Article not found'],
      },
    });
  }

  if (article.author.username !== user.username) {
    return res.status(403).json({
      errors: {
        body: ['You can only edit your own articles'],
      },
    });
  }

  const title =
    typeof req.body?.article?.title === 'string'
      ? req.body.article.title.trim()
      : undefined;
  const description =
    typeof req.body?.article?.description === 'string'
      ? req.body.article.description.trim()
      : undefined;
  const body =
    typeof req.body?.article?.body === 'string'
      ? req.body.article.body.trim()
      : undefined;
  const tagList = Array.isArray(req.body?.article?.tagList)
    ? req.body.article.tagList
        .filter((tag: unknown) => typeof tag === 'string')
        .map((tag: string) => tag.trim())
        .filter(Boolean)
    : undefined;

  if (
    title === undefined &&
    description === undefined &&
    body === undefined &&
    tagList === undefined
  ) {
    return res.status(422).json({
      errors: {
        body: ['At least one article field is required'],
      },
    });
  }

  if (title !== undefined && !title) {
    return res.status(422).json({
      errors: {
        body: ['Title cannot be empty'],
      },
    });
  }

  if (description !== undefined && !description) {
    return res.status(422).json({
      errors: {
        body: ['Description cannot be empty'],
      },
    });
  }

  if (body !== undefined && !body) {
    return res.status(422).json({
      errors: {
        body: ['Body cannot be empty'],
      },
    });
  }

  if (title !== undefined) {
    article.title = title;
    article.slug = createSlug(title, article.slug);
  }
  if (description !== undefined) article.description = description;
  if (body !== undefined) article.body = body;
  if (tagList !== undefined) article.tagList = tagList;

  article.updatedAt = new Date().toISOString();

  return res.json({ article });
});

articlesRouter.delete('/:slug', requireAuth, (req, res) => {
  const authReq = req as AuthRequest;
  const user = findUserById(authReq.userId);
  const articleIndex = articles.findIndex((item) => item.slug === req.params.slug);

  if (!user) {
    return res.status(404).json({
      errors: {
        body: ['User not found'],
      },
    });
  }

  if (articleIndex === -1) {
    return res.status(404).json({
      errors: {
        body: ['Article not found'],
      },
    });
  }

  const article = articles[articleIndex];

  if (!article) {
    return res.status(404).json({
      errors: {
        body: ['Article not found'],
      },
    });
  }

  if (article.author.username !== user.username) {
    return res.status(403).json({
      errors: {
        body: ['You can only delete your own articles'],
      },
    });
  }

  articles.splice(articleIndex, 1);

  return res.sendStatus(204);
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

  return res.json({
    comments: comments
      .filter((comment) => comment.articleSlug === article.slug)
      .map(({ articleSlug: _articleSlug, ...comment }) => comment),
  });
});

articlesRouter.post('/:slug/comments', requireAuth, (req, res) => {
  const authReq = req as AuthRequest;
  const user = findUserById(authReq.userId);
  const article = articles.find((item) => item.slug === req.params.slug);
  const body =
    typeof req.body?.comment?.body === 'string'
      ? req.body.comment.body.trim()
      : '';

  if (!user) {
    return res.status(404).json({
      errors: {
        body: ['User not found'],
      },
    });
  }

  if (!article) {
    return res.status(404).json({
      errors: {
        body: ['Article not found'],
      },
    });
  }

  if (!body) {
    return res.status(422).json({
      errors: {
        body: ['Comment body is required'],
      },
    });
  }

  const now = new Date().toISOString();
  const comment: StoredComment = {
    id: comments.length + 1,
    articleSlug: article.slug,
    body,
    createdAt: now,
    updatedAt: now,
    author: {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following: false,
    },
  };

  comments.unshift(comment);

  return res.status(201).json({
    comment: {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: comment.author,
    },
  });
});

articlesRouter.delete('/:slug/comments/:id', requireAuth, (req, res) => {
  const authReq = req as AuthRequest;
  const user = findUserById(authReq.userId);
  const article = articles.find((item) => item.slug === req.params.slug);
  const commentId = Number(req.params.id);

  if (!user) {
    return res.status(404).json({
      errors: {
        body: ['User not found'],
      },
    });
  }

  if (!article) {
    return res.status(404).json({
      errors: {
        body: ['Article not found'],
      },
    });
  }

  const commentIndex = comments.findIndex(
    (comment) => comment.articleSlug === article.slug && comment.id === commentId,
  );

  if (commentIndex === -1) {
    return res.status(404).json({
      errors: {
        body: ['Comment not found'],
      },
    });
  }

  const comment = comments[commentIndex];

  if (!comment) {
    return res.status(404).json({
      errors: {
        body: ['Comment not found'],
      },
    });
  }

  if (comment.author.username !== user.username) {
    return res.status(403).json({
      errors: {
        body: ['You can only delete your own comments'],
      },
    });
  }

  comments.splice(commentIndex, 1);

  return res.sendStatus(204);
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
