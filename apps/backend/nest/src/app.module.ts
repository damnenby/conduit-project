import { Module } from '@nestjs/common';
import { BooksModule } from './modules/books/books.module';
import { DbModule } from './modules/db/db.module';
import { resolve } from 'node:path';

import 'dotenv/config';

const dbPath =
  process.env.DATABASE_MODE === 'prisma'
    ? resolve(__dirname, process.env.DATABASE_URL ?? '')
    : resolve(__dirname, 'db.json');

console.log(dbPath);

@Module({
  imports: [BooksModule, DbModule.forRoot({ dbPath })],
  controllers: [],
  providers: [],
})
export class AppModule {}
