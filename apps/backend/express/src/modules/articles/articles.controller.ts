import { Router } from 'express';
import type { Article, Comment } from '@common/model';
import type { Prisma } from '@common/database';
import { prisma } from '../../db/prisma';
import { optionalAuth, requireAuth, type AuthRequest } from '../../middleware/auth';
import { findUserById } from '../users/users.controller';

export const articlesRouter: Router = Router();

type StoredComment = Comment & { articleSlug: string };
type ArticleFromDatabase = Prisma.ArticleGetPayload<{
  include: {
    author: true;
    tags: {
      include: {
        tag: true;
      };
    };
    favorites: true;
  };
}>;
type CommentFromDatabase = Prisma.CommentGetPayload<{
  include: {
    author: true;
  };
}>;

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

const createDatabaseSlug = async (title: string, currentSlug?: string) => {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let suffix = 2;

  while (
    articles.some((article) => article.slug === slug && article.slug !== currentSlug) ||
    Boolean(
      await prisma.article.findFirst({
        where: currentSlug ? { slug, NOT: { slug: currentSlug } } : { slug },
      }),
    )
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

const mapArticleFromDatabase = (
  article: ArticleFromDatabase,
  currentUserId?: number,
): Article => {
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: article.tags.map((articleTag) => articleTag.tag.name),
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    favorited: currentUserId
      ? article.favorites.some((favorite) => favorite.userId === currentUserId)
      : false,
    favoritesCount: article.favorites.length,
    author: {
      username: article.author.username,
      bio: article.author.bio,
      image: article.author.image,
      following: false,
    },
  };
};

const mapCommentFromDatabase = (comment: CommentFromDatabase): Comment => {
  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    author: {
      username: comment.author.username,
      bio: comment.author.bio,
      image: comment.author.image,
      following: false,
    },
  };
};

articlesRouter.get('/', optionalAuth, async (req, res) => {
  const authReq = req as AuthRequest;
  const tag = req.query.tag?.toString();
  const author = req.query.author?.toString();
  const favorited = req.query.favorited?.toString();
  const limit = Number(req.query.limit ?? 20);
  const offset = Number(req.query.offset ?? 0);
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 20;
  const safeOffset = Number.isFinite(offset) && offset > 0 ? offset : 0;
  const where: Prisma.ArticleWhereInput = {};

  if (tag) where.tags = { some: { tag: { name: tag } } };
  if (author) where.author = { username: author };
  if (favorited) where.favorites = { some: { user: { username: favorited } } };

  const [databaseArticles, articlesCount] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip: safeOffset,
      take: safeLimit,
      include: {
        author: true,
        tags: {
          include: {
            tag: true,
          },
        },
        favorites: true,
      },
    }),
    prisma.article.count({ where }),
  ]);

  return res.json({
    articles: databaseArticles.map((article) =>
      mapArticleFromDatabase(article, authReq.userId),
    ),
    articlesCount,
  });
});

articlesRouter.post('/', requireAuth, async (req, res) => {
  const authReq = req as AuthRequest;
  const user = await findUserById(authReq.userId);
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
  const tagList: string[] = Array.isArray(req.body?.article?.tagList)
    ? Array.from(
        new Set(
          req.body.article.tagList
            .filter((tag: unknown): tag is string => typeof tag === 'string')
            .map((tag: string) => tag.trim())
            .filter(Boolean),
        ),
      )
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

  const savedArticle = await prisma.article.create({
    data: {
      slug: await createDatabaseSlug(title),
      title,
      description,
      body,
      authorId: user.id,
      tags: {
        create: tagList.map((name) => ({
          tag: {
            connectOrCreate: {
              where: { name },
              create: { name },
            },
          },
        })),
      },
    },
  });

  const article: Article = {
    slug: savedArticle.slug,
    title: savedArticle.title,
    description: savedArticle.description,
    body: savedArticle.body,
    tagList,
    createdAt: savedArticle.createdAt.toISOString(),
    updatedAt: savedArticle.updatedAt.toISOString(),
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

articlesRouter.get('/:slug', optionalAuth, async (req, res) => {
  const authReq = req as AuthRequest;
  const slug = String(req.params.slug);
  const article = await prisma.article.findUnique({
    where: {
      slug,
    },
    include: {
      author: true,
      tags: {
        include: {
          tag: true,
        },
      },
      favorites: true,
    },
  });

  if (!article) {
    return res.status(404).json({
      errors: {
        body: ['Article not found'],
      },
    });
  }

  return res.json({
    article: mapArticleFromDatabase(article, authReq.userId),
  });
});

articlesRouter.put('/:slug', requireAuth, async (req, res) => {
  const authReq = req as AuthRequest;
  const user = await findUserById(authReq.userId);
  const slug = String(req.params.slug);
  const article = await prisma.article.findUnique({
    where: {
      slug,
    },
    include: {
      author: true,
      tags: {
        include: {
          tag: true,
        },
      },
      favorites: true,
    },
  });

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

  if (article.authorId !== user.id) {
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
  const tagList: string[] | undefined = Array.isArray(req.body?.article?.tagList)
    ? Array.from(
        new Set(
          req.body.article.tagList
            .filter((tag: unknown): tag is string => typeof tag === 'string')
            .map((tag: string) => tag.trim())
            .filter(Boolean),
        ),
      )
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

  const updateData: Prisma.ArticleUpdateInput = {};

  if (title !== undefined) {
    updateData.title = title;
    updateData.slug = await createDatabaseSlug(title, article.slug);
  }
  if (description !== undefined) updateData.description = description;
  if (body !== undefined) updateData.body = body;
  if (tagList !== undefined) {
    updateData.tags = {
      deleteMany: {},
      create: tagList.map((name) => ({
        tag: {
          connectOrCreate: {
            where: { name },
            create: { name },
          },
        },
      })),
    };
  }

  const updatedArticle = await prisma.article.update({
    where: {
      id: article.id,
    },
    data: updateData,
    include: {
      author: true,
      tags: {
        include: {
          tag: true,
        },
      },
      favorites: true,
    },
  });

  return res.json({
    article: mapArticleFromDatabase(updatedArticle, user.id),
  });
});

articlesRouter.delete('/:slug', requireAuth, async (req, res) => {
  const authReq = req as AuthRequest;
  const user = await findUserById(authReq.userId);
  const slug = String(req.params.slug);
  const article = await prisma.article.findUnique({
    where: {
      slug,
    },
  });

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

  if (article.authorId !== user.id) {
    return res.status(403).json({
      errors: {
        body: ['You can only delete your own articles'],
      },
    });
  }

  await prisma.article.delete({
    where: {
      id: article.id,
    },
  });

  const articleIndex = articles.findIndex((item) => item.slug === slug);
  if (articleIndex !== -1) articles.splice(articleIndex, 1);

  return res.sendStatus(204);
});

articlesRouter.get('/:slug/comments', async (req, res) => {
  const slug = String(req.params.slug);
  const article = await prisma.article.findUnique({
    where: {
      slug,
    },
  });

  if (!article) {
    return res.status(404).json({
      errors: {
        body: ['Article not found'],
      },
    });
  }

  const databaseComments = await prisma.comment.findMany({
    where: {
      articleId: article.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      author: true,
    },
  });

  return res.json({
    comments: databaseComments.map(mapCommentFromDatabase),
  });
});

articlesRouter.post('/:slug/comments', requireAuth, async (req, res) => {
  const authReq = req as AuthRequest;
  const user = await findUserById(authReq.userId);
  const slug = String(req.params.slug);
  const article = await prisma.article.findUnique({
    where: {
      slug,
    },
  });
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

  const comment = await prisma.comment.create({
    data: {
      articleId: article.id,
      authorId: user.id,
      body,
    },
    include: {
      author: true,
    },
  });

  comments.unshift({
    id: comment.id,
    articleSlug: slug,
    body,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    author: {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following: false,
    },
  });

  return res.status(201).json({
    comment: mapCommentFromDatabase(comment),
  });
});

articlesRouter.delete('/:slug/comments/:id', requireAuth, async (req, res) => {
  const authReq = req as AuthRequest;
  const user = await findUserById(authReq.userId);
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
