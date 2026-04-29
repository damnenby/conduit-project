import { BookSchema, type Book, type CreateBookDto } from '@common/model';
import type { DbService } from '../../db.interface';
import { PrismaClient } from '../prisma/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

export class DbPrismaService implements DbService<Book> {
  constructor(
    url = process.env.DATABASE_URL ?? '',
    adapter = new PrismaBetterSqlite3({ url }),
    private readonly prisma = new PrismaClient({ adapter }),
  ) {}

  connect(): Promise<void> {
    return this.prisma.$connect();
  }

  async getAll(): Promise<Book[]> {
    const books = await this.prisma.book.findMany();
    return BookSchema.array().parse(books);
  }

  async createOne(entity: CreateBookDto): Promise<Book> {
    const newBook = await this.prisma.book.create({ data: entity });
    return BookSchema.parse(newBook);
  }

  async getOne(id: number): Promise<Book | undefined> {
    const book = await this.prisma.book.findUnique({ where: { id } });
    if (!book) return undefined;

    return BookSchema.parse(book);
  }

  async setOne(id: number, entity: Book): Promise<void> {
    await this.prisma.book.update({ where: { id }, data: entity });
  }

  async deleteOne(id: number): Promise<boolean> {
    try {
      const deletedBook = await this.prisma.book.delete({ where: { id } });
      return !!deletedBook;
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        switch (err.code) {
          case 'P2025':
            console.error('NOT_FOUND!!');
            break;
        }
      }

      console.error(err);
      return false;
    }
  }
}
