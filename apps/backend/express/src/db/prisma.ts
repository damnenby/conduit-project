import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@common/database';

const databaseUrl =
  process.env.DATABASE_URL ?? 'file:../../../libs/database/sqlite/dev.db';

const adapter = new PrismaBetterSqlite3({ url: databaseUrl });

export const prisma = new PrismaClient({ adapter });
