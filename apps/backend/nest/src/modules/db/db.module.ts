import {
  Logger,
  Module,
  type DynamicModule,
  type Provider,
} from '@nestjs/common';
import { DbJsonService, DbPrismaService } from '@common/database';

import 'dotenv/config';

export interface DbModuleOptions {
  dbPath: string;
}

export const DB_PATH_TOKEN = 'DbPath';
export const DB_SERVICE_TOKEN = 'DbService';

export const provideDbPath = (dbPath: string): Provider => ({
  provide: DB_PATH_TOKEN,
  useValue: dbPath,
});

export const provideDbService = (): Provider => ({
  provide: DB_SERVICE_TOKEN,
  useFactory: (dbPath: string) => {
    switch (process.env.DATABASE_MODE) {
      case 'prisma': {
        const service = new DbPrismaService(dbPath);
        void service.connect();
        return service;
      }

      case 'json': {
        const service = new DbJsonService(dbPath);
        void service.connect();
        return service;
      }

      default:
        throw new Error(
          `Unsupported DATABASE_MODE: ${process.env.DATABASE_MODE}. Supported modes are: prisma, json.`,
        );
    }
  },
  inject: [DB_PATH_TOKEN],
});

@Module({})
export class DbModule {
  static forRoot(options: DbModuleOptions): DynamicModule {
    const dbPath = options.dbPath;

    Logger.debug(`Initializing database at: ${dbPath}`);

    return {
      global: true,
      module: DbModule,
      providers: [provideDbPath(dbPath), provideDbService()],
      exports: [DB_SERVICE_TOKEN],
    };
  }
}
