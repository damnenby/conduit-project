import { Router } from 'express';
import { prisma } from '../../db/prisma';

export const tagsRouter: Router = Router();

tagsRouter.get('/', async (_req, res) => {
  const tags = await prisma.tag.findMany({
    where: {
      articles: {
        some: {},
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return res.json({ tags: tags.map((tag) => tag.name) });
});
