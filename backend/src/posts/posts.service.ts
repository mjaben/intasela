import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async getFeed() {
    return this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatarUrl: true,
            creatorType: true,
          }
        },
        _count: {
          select: { engagements: true }
        }
      },
      take: 20, // Simple pagination/limit for now
    });
  }

  async createPost(userId: string, content: string) {
    return this.prisma.post.create({
      data: {
        content,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatarUrl: true,
            creatorType: true,
          }
        },
        _count: {
          select: { engagements: true }
        }
      }
    });
  }
}
