import { writeFile, readFile } from 'node:fs/promises';
import type { Book, CreateBookDto } from '@common/model';
import type { DbService } from '../db.interface';

let count = 0;
const createId = () => {
  return count++;
};

export class DbJsonService implements DbService<Book> {
  private cache = new Map<Book['id'], Book>();

  constructor(protected path: string) {}

  private write() {
    const ary = Array.from(this.cache);
    return writeFile(this.path, JSON.stringify(ary), { encoding: 'utf-8' });
  }

  async createOne(entity: CreateBookDto) {
    const id = createId();
    const book: Book = { id, ...entity };

    this.cache.set(id, book);
    await this.write();

    return book;
  }

  public async getAll() {
    return Array.from(this.cache.values());
  }

  public async getOne(id: Book['id']) {
    return this.cache.get(id);
  }

  public async setOne(id: Book['id'], book: Book) {
    this.cache.set(id, book);
    await this.write();
  }

  public async deleteOne(id: number) {
    const success = this.cache.delete(id);
    await this.write();

    return success;
  }

  public async connect() {
    try {
      const contents = await readFile(this.path, { encoding: 'utf-8' });
      this.cache = new Map(JSON.parse(contents));
    } catch (err) {
      // TODO: check for ENOENT
      if (err instanceof Error) {
        this.cache = new Map();
        this.write();
      }
    }
  }
}
