import { resolve } from 'node:path';
import { DbJsonService, DbPrismaService } from '@common/database';

import 'dotenv/config';

type DbProvider = 'json' | 'prisma';

const __dirname = import.meta.dirname;

const initDatabaseService = () => {
  const db_provider: DbProvider = (process.env.DB_PROVIDER as DbProvider) ?? 'json';

  console.info(`Init ${db_provider} Database`);

  switch (db_provider) {
    case 'json':
      return new DbJsonService(resolve(__dirname, '../../../db.json'));

    case 'prisma':
      return new DbPrismaService(process.env.DATABASE_URL);

    default:
      throw new Error(`Only the following provider are supported ${['json', 'prisma'].join(', ')}`);
  }
};

export const dbService = initDatabaseService();
