import { Injectable } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
// PrismaClient is a runtime value, so it is imported via a relative path that
// resolves without a path-alias loader. Types still come from @common/database.
import { PrismaClient } from '../../../../../libs/database/sqlite/prisma/generated/prisma/client';

const databaseUrl =
  process.env.DATABASE_URL ?? 'file:../../../libs/database/sqlite/dev.db';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({ adapter: new PrismaBetterSqlite3({ url: databaseUrl }) });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
