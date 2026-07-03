import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const tags = await this.prisma.tag.findMany({
      where: {
        articles: {
          some: {},
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return { tags: tags.map((tag) => tag.name) };
  }
}
