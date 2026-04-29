import * as z from 'zod';

export const BookSchema = z.object({
  id: z.number(),
  title: z.string(),
  author: z.string(),
  year: z.number(),
});

export const CreateBookDtoSchema = BookSchema.omit({ id: true });
export const UpdateBookDtoSchema = CreateBookDtoSchema.partial();

export type Book = z.infer<typeof BookSchema>;
export type CreateBookDto = z.infer<typeof CreateBookDtoSchema>;
export type UpdateBookDto = z.infer<typeof UpdateBookDtoSchema>;
