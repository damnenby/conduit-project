import { BookSchema, type Book, type CreateBookDto, type UpdateBookDto, NotFoundError } from '@common/model';
import type { DbService } from '@common/database';
import { dbService } from '../db/db.service';

export class BooksService {
  constructor(private db: DbService<Book>) {}

  /** Get list of all books from DB. */
  getAllBooks(): Promise<Book[]> {
    return this.db.getAll();
  }

  /** Get a book by id from DB. */
  async getBookById(id: number): Promise<Book> {
    const result = await this.db.getOne(id);
    if (!result) throw new NotFoundError(`Book with id ${id} not found`);

    return result;
  }

  /** Create a new book in DB. */
  createBook(dto: CreateBookDto): Promise<Book> {
    return this.db.createOne(dto);
  }

  /** Delete a book by id from DB. */
  async deleteBook(id: number): Promise<void> {
    const exists = await this.db.deleteOne(id);
    if (!exists) throw new NotFoundError(`Book with id ${id} not found`);
  }

  /** Replace a book by id in DB. */
  async replaceBook(id: number, dto: CreateBookDto): Promise<Book> {
    const book: Book = { id, ...dto };
    await this.db.setOne(id, book);

    return book;
  }

  /** Update a book by id in DB. */
  async updateBook(id: number, dto: UpdateBookDto): Promise<Book> {
    const book = this.db.getOne(id);
    if (!book) throw new NotFoundError(`Book with id ${id} not found`);

    const patchedBook = BookSchema.parse({ ...book, ...dto });

    await this.db.setOne(id, patchedBook);

    return patchedBook;
  }
}

export const booksService = new BooksService(dbService);
