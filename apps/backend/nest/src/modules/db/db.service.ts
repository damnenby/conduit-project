import { Inject, Injectable, OnModuleInit, type Type } from '@nestjs/common';
import {
  DbJsonService,
  DbPrismaService,
  DbService as IDbService,
} from '@common/database';
import { DB_PATH_TOKEN } from './db.module';

import 'dotenv/config';
import type { Book } from '@common/model';

const ServiceClass: Type<IDbService<Book>> =
  process.env.DATABASE_MODE === 'prisma' ? DbPrismaService : DbJsonService;

@Injectable()
export class DbService extends ServiceClass implements OnModuleInit {
  constructor(@Inject(DB_PATH_TOKEN) dbPath: string) {
    super(dbPath);
  }

  async onModuleInit() {
    await this.connect();
  }
}
