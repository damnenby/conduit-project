import * as z from 'zod';

export const ProfileSchema = z.object({
  username: z.string(),
  bio: z.string().nullable(),
  image: z.string().nullable(),
  following: z.boolean(),
});

export const ArticleSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  body: z.string(),
  tagList: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  favorited: z.boolean(),
  favoritesCount: z.number(),
  author: ProfileSchema,
});

export type Profile = z.infer<typeof ProfileSchema>;
export type Article = z.infer<typeof ArticleSchema>;
