import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { apiError } from '../common/api-error';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(username: string, currentUserId: number | undefined) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw apiError(['Profile not found'], HttpStatus.NOT_FOUND);
    }

    let following = false;

    if (currentUserId) {
      const follow = await this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: user.id,
          },
        },
      });

      following = Boolean(follow);
    }

    return {
      profile: {
        username: user.username,
        bio: user.bio,
        image: user.image,
        following,
      },
    };
  }

  async follow(username: string, currentUserId: number) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw apiError(['Profile not found'], HttpStatus.NOT_FOUND);
    }

    if (user.id === currentUserId) {
      throw apiError(['You cannot follow yourself'], HttpStatus.UNPROCESSABLE_ENTITY);
    }

    await this.prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: user.id,
        },
      },
      update: {},
      create: {
        followerId: currentUserId,
        followingId: user.id,
      },
    });

    return {
      profile: {
        username: user.username,
        bio: user.bio,
        image: user.image,
        following: true,
      },
    };
  }

  async unfollow(username: string, currentUserId: number) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw apiError(['Profile not found'], HttpStatus.NOT_FOUND);
    }

    await this.prisma.follow.deleteMany({
      where: {
        followerId: currentUserId,
        followingId: user.id,
      },
    });

    return {
      profile: {
        username: user.username,
        bio: user.bio,
        image: user.image,
        following: false,
      },
    };
  }
}
