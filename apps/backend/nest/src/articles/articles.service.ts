import { HttpStatus, Injectable } from '@nestjs/common';
import type { Article, Comment } from '@common/model';
import type { Prisma } from '@common/database';
import { PrismaService } from '../prisma/prisma.service';
import { apiError } from '../common/api-error';

const articleInclude = {
  author: {
    include: {
      followers: true,
    },
  },
  tags: {
    include: {
      tag: true,
    },
  },
  favorites: true,
} satisfies Prisma.ArticleInclude;

const commentInclude = {
  author: {
    include: {
      followers: true,
    },
  },
} satisfies Prisma.CommentInclude;

type ArticleFromDatabase = Prisma.ArticleGetPayload<{
  include: typeof articleInclude;
}>;
type CommentFromDatabase = Prisma.CommentGetPayload<{
  include: typeof commentInclude;
}>;

const slugify = (title: string) => {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'article'
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
      following: currentUserId
        ? article.author.followers.some(
            (follow) => follow.followerId === currentUserId,
          )
        : false,
    },
  };
};

const mapCommentFromDatabase = (
  comment: CommentFromDatabase,
  currentUserId?: number,
): Comment => {
  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    author: {
      username: comment.author.username,
      bio: comment.author.bio,
      image: comment.author.image,
      following: currentUserId
        ? comment.author.followers.some(
            (follow) => follow.followerId === currentUserId,
          )
        : false,
    },
  };
};

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  private async createDatabaseSlug(title: string, currentSlug?: string) {
    const baseSlug = slugify(title);
    let slug = baseSlug;
    let suffix = 2;

    while (
      Boolean(
        await this.prisma.article.findFirst({
          where: currentSlug ? { slug, NOT: { slug: currentSlug } } : { slug },
        }),
      )
    ) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }

  private async requireUser(userId: number | undefined) {
    const user = userId
      ? await this.prisma.user.findUnique({ where: { id: userId } })
      : null;

    if (!user) {
      throw apiError(['User not found'], HttpStatus.NOT_FOUND);
    }

    return user;
  }

  async list(query: any, currentUserId: number | undefined) {
    const tag = query.tag?.toString();
    const author = query.author?.toString();
    const favorited = query.favorited?.toString();
    const limit = Number(query.limit ?? 20);
    const offset = Number(query.offset ?? 0);
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 20;
    const safeOffset = Number.isFinite(offset) && offset > 0 ? offset : 0;
    const where: Prisma.ArticleWhereInput = {};

    if (tag) where.tags = { some: { tag: { name: tag } } };
    if (author) where.author = { username: author };
    if (favorited)
      where.favorites = { some: { user: { username: favorited } } };

    const [databaseArticles, articlesCount] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: safeOffset,
        take: safeLimit,
        include: articleInclude,
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      articles: databaseArticles.map((article) =>
        mapArticleFromDatabase(article, currentUserId),
      ),
      articlesCount,
    };
  }

  async create(body: any, userId: number) {
    const user = await this.requireUser(userId);
    const title =
      typeof body?.article?.title === 'string'
        ? body.article.title.trim()
        : '';
    const description =
      typeof body?.article?.description === 'string'
        ? body.article.description.trim()
        : '';
    const articleBody =
      typeof body?.article?.body === 'string' ? body.article.body.trim() : '';
    const tagList: string[] = Array.isArray(body?.article?.tagList)
      ? Array.from(
          new Set(
            body.article.tagList
              .filter((tag: unknown): tag is string => typeof tag === 'string')
              .map((tag: string) => tag.trim())
              .filter(Boolean),
          ),
        )
      : [];

    if (!title || !description || !articleBody) {
      throw apiError(
        ['Title, description and body are required'],
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const savedArticle = await this.prisma.article.create({
      data: {
        slug: await this.createDatabaseSlug(title),
        title,
        description,
        body: articleBody,
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

    const article = await this.prisma.article.findUnique({
      where: { id: savedArticle.id },
      include: articleInclude,
    });

    if (!article) {
      throw apiError(['Article not found'], HttpStatus.NOT_FOUND);
    }

    return { article: mapArticleFromDatabase(article, user.id) };
  }

  async feed(query: any, userId: number) {
    const user = await this.requireUser(userId);
    const limit = Number(query.limit ?? 20);
    const offset = Number(query.offset ?? 0);
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 20;
    const safeOffset = Number.isFinite(offset) && offset > 0 ? offset : 0;

    const where: Prisma.ArticleWhereInput = {
      author: {
        followers: {
          some: {
            followerId: user.id,
          },
        },
      },
    };

    const [feedArticles, articlesCount] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: safeOffset,
        take: safeLimit,
        include: articleInclude,
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      articles: feedArticles.map((article) =>
        mapArticleFromDatabase(article, user.id),
      ),
      articlesCount,
    };
  }

  async getOne(slug: string, currentUserId: number | undefined) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: articleInclude,
    });

    if (!article) {
      throw apiError(['Article not found'], HttpStatus.NOT_FOUND);
    }

    return { article: mapArticleFromDatabase(article, currentUserId) };
  }

  async update(slug: string, body: any, userId: number) {
    const user = await this.requireUser(userId);
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: articleInclude,
    });

    if (!article) {
      throw apiError(['Article not found'], HttpStatus.NOT_FOUND);
    }

    if (article.authorId !== user.id) {
      throw apiError(
        ['You can only edit your own articles'],
        HttpStatus.FORBIDDEN,
      );
    }

    const title =
      typeof body?.article?.title === 'string'
        ? body.article.title.trim()
        : undefined;
    const description =
      typeof body?.article?.description === 'string'
        ? body.article.description.trim()
        : undefined;
    const articleBody =
      typeof body?.article?.body === 'string'
        ? body.article.body.trim()
        : undefined;
    const tagList: string[] | undefined = Array.isArray(body?.article?.tagList)
      ? Array.from(
          new Set(
            body.article.tagList
              .filter((tag: unknown): tag is string => typeof tag === 'string')
              .map((tag: string) => tag.trim())
              .filter(Boolean),
          ),
        )
      : undefined;

    if (
      title === undefined &&
      description === undefined &&
      articleBody === undefined &&
      tagList === undefined
    ) {
      throw apiError(
        ['At least one article field is required'],
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (title !== undefined && !title) {
      throw apiError(['Title cannot be empty'], HttpStatus.UNPROCESSABLE_ENTITY);
    }

    if (description !== undefined && !description) {
      throw apiError(['Description cannot be empty'], HttpStatus.UNPROCESSABLE_ENTITY);
    }

    if (articleBody !== undefined && !articleBody) {
      throw apiError(['Body cannot be empty'], HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const updateData: Prisma.ArticleUpdateInput = {};

    if (title !== undefined) {
      updateData.title = title;
      updateData.slug = await this.createDatabaseSlug(title, article.slug);
    }
    if (description !== undefined) updateData.description = description;
    if (articleBody !== undefined) updateData.body = articleBody;
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

    const updatedArticle = await this.prisma.article.update({
      where: { id: article.id },
      data: updateData,
      include: articleInclude,
    });

    return { article: mapArticleFromDatabase(updatedArticle, user.id) };
  }

  async remove(slug: string, userId: number) {
    const user = await this.requireUser(userId);
    const article = await this.prisma.article.findUnique({
      where: { slug },
    });

    if (!article) {
      throw apiError(['Article not found'], HttpStatus.NOT_FOUND);
    }

    if (article.authorId !== user.id) {
      throw apiError(
        ['You can only delete your own articles'],
        HttpStatus.FORBIDDEN,
      );
    }

    await this.prisma.article.delete({
      where: { id: article.id },
    });
  }

  async getComments(slug: string, currentUserId: number | undefined) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
    });

    if (!article) {
      throw apiError(['Article not found'], HttpStatus.NOT_FOUND);
    }

    const databaseComments = await this.prisma.comment.findMany({
      where: { articleId: article.id },
      orderBy: { createdAt: 'desc' },
      include: commentInclude,
    });

    return {
      comments: databaseComments.map((comment) =>
        mapCommentFromDatabase(comment, currentUserId),
      ),
    };
  }

  async addComment(slug: string, body: any, userId: number) {
    const user = await this.requireUser(userId);
    const article = await this.prisma.article.findUnique({
      where: { slug },
    });
    const commentBody =
      typeof body?.comment?.body === 'string' ? body.comment.body.trim() : '';

    if (!article) {
      throw apiError(['Article not found'], HttpStatus.NOT_FOUND);
    }

    if (!commentBody) {
      throw apiError(['Comment body is required'], HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const comment = await this.prisma.comment.create({
      data: {
        articleId: article.id,
        authorId: user.id,
        body: commentBody,
      },
      include: commentInclude,
    });

    return { comment: mapCommentFromDatabase(comment, user.id) };
  }

  async deleteComment(slug: string, commentIdInput: string, userId: number) {
    const user = await this.requireUser(userId);
    const article = await this.prisma.article.findUnique({
      where: { slug },
    });
    const commentId = Number(commentIdInput);

    if (!Number.isInteger(commentId)) {
      throw apiError(['Comment not found'], HttpStatus.NOT_FOUND);
    }

    if (!article) {
      throw apiError(['Article not found'], HttpStatus.NOT_FOUND);
    }

    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, articleId: article.id },
    });

    if (!comment) {
      throw apiError(['Comment not found'], HttpStatus.NOT_FOUND);
    }

    if (comment.authorId !== user.id) {
      throw apiError(
        ['You can only delete your own comments'],
        HttpStatus.FORBIDDEN,
      );
    }

    await this.prisma.comment.delete({
      where: { id: comment.id },
    });
  }

  async favorite(slug: string, userId: number) {
    const user = await this.requireUser(userId);
    const article = await this.prisma.article.findUnique({
      where: { slug },
    });

    if (!article) {
      throw apiError(['Article not found'], HttpStatus.NOT_FOUND);
    }

    await this.prisma.favorite.upsert({
      where: {
        userId_articleId: {
          userId: user.id,
          articleId: article.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        articleId: article.id,
      },
    });

    const updatedArticle = await this.prisma.article.findUnique({
      where: { id: article.id },
      include: articleInclude,
    });

    if (!updatedArticle) {
      throw apiError(['Article not found'], HttpStatus.NOT_FOUND);
    }

    return { article: mapArticleFromDatabase(updatedArticle, user.id) };
  }

  async unfavorite(slug: string, userId: number) {
    const user = await this.requireUser(userId);
    const article = await this.prisma.article.findUnique({
      where: { slug },
    });

    if (!article) {
      throw apiError(['Article not found'], HttpStatus.NOT_FOUND);
    }

    await this.prisma.favorite.deleteMany({
      where: {
        userId: user.id,
        articleId: article.id,
      },
    });

    const updatedArticle = await this.prisma.article.findUnique({
      where: { id: article.id },
      include: articleInclude,
    });

    if (!updatedArticle) {
      throw apiError(['Article not found'], HttpStatus.NOT_FOUND);
    }

    return { article: mapArticleFromDatabase(updatedArticle, user.id) };
  }
}
