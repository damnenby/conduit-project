import * as z from 'zod';

export const ArticleSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  body: z.string(),
  tagList: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  favoritesCount: z.number(),
});

export type Article = z.infer<typeof ArticleSchema>;
