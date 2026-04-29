import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  BookSchema,
  type Book,
  type CreateBookDto,
  type UpdateBookDto,
} from '@common/model';
import type { DbService as DbServiceBase } from '@common/database';
import { DB_SERVICE_TOKEN } from '../db/db.module';

@Injectable()
export class BooksService {
  constructor(@Inject(DB_SERVICE_TOKEN) private db: DbServiceBase<Book>) {}

  /** Get list of all books from DB. */
  getAllBooks(): Promise<Book[]> {
    return this.db.getAll();
  }

  /** Get a book by id from DB. */
  async getBookById(id: number): Promise<Book> {
    const result = await this.db.getOne(id);
    if (!result) throw new NotFoundException(`Book with id ${id} not found`);

    return result;
  }

  /** Create a new book in DB. */
  async createBook(dto: CreateBookDto): Promise<Book> {
    return this.db.createOne(dto);
  }

  /** Delete a book by id from DB. */
  async deleteBook(id: number): Promise<void> {
    const exists = await this.db.deleteOne(id);

    if (!exists) {
      throw new NotFoundException(`Book with id ${id} not found`);
    }
  }

  /** Replace a book by id in DB. */
  async replaceBook(id: number, dto: CreateBookDto): Promise<Book> {
    const book = BookSchema.parse({ id, ...dto });
    await this.db.setOne(id, book);

    return book;
  }

  /** Update a book by id in DB. */
  async updateBook(id: number, dto: UpdateBookDto): Promise<Book> {
    const book = await this.db.getOne(id);
    if (!book) throw new NotFoundException(`Book with id ${id} not found`);

    const patchedBook = BookSchema.parse({ ...book, ...dto });

    await this.db.setOne(id, patchedBook);

    return patchedBook;
  }
}
