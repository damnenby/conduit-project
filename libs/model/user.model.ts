import * as z from 'zod';

export const UserSchema = z.object({
  email: z.string(),
  token: z.string(),
  username: z.string(),
  bio: z.string().nullable(),
  image: z.string().nullable(),
});

export type User = z.infer<typeof UserSchema>;
