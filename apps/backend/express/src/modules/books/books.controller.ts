import { Router } from 'express';
import { booksService } from './books.service.js';
import { CreateBookDtoSchema, UpdateBookDtoSchema, NotFoundError } from '@common/model';
import z, { ZodError } from 'zod';

export const router: Router = Router();

// ---- Books list operations ----
router
  .route('/')

  // Get all books
  .get(async (req, res) => {
    const result = await booksService.getAllBooks();
    return res.json(result);
  })

  // Create a new book
  .post(async (req, res) => {
    try {
      const dto = CreateBookDtoSchema.parse(req.body);

      const result = await booksService.createBook(dto);
      return res.status(201).json(result);
    } catch (err) {
      console.error(err);

      if (err instanceof ZodError) {
        return res.status(400).json({ message: z.treeifyError(err) });
      }

      if (err instanceof NotFoundError) {
        return res.status(404).json({ message: err.message });
      }
    }
  });

// --- Book item operations ---
router
  .route('/:id')

  // Get a book by id
  .get(async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await booksService.getBookById(id);

      return res.json(result);
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        return res.status(400).json({ message: err.message });
      }
    }
  })

  // Replace a book by id
  .put(async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const dto = CreateBookDtoSchema.parse(req.body);

      const result = await booksService.replaceBook(id, dto);

      return res.json(result);
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        return res.status(400).json({ message: err.message });
      }

      return res.status(500).json({ message: 'an error occured' });
    }
  })

  // Update a book by id
  .patch(async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const dto = UpdateBookDtoSchema.parse(req.body);

      const result = await booksService.updateBook(id, dto);
      return res.json(result);
    } catch (err) {
      if (err instanceof NotFoundError) {
        return res.status(404).json({ message: err.message });
      }
    }
  })

  // Delete a book by id
  .delete(async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await booksService.deleteBook(id);

      return res.sendStatus(204);
    } catch (err) {
      if (err instanceof NotFoundError) {
        return res.status(404).json({ message: err.message });
      }
    }
  });
