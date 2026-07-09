import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }
  
  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async getProfileByUsername(username: string, currentUserId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        avatarUrl: true,
        coverUrl: true,
        occupation: true,
        bio: true,
        interests: true,
        country: true,
        state: true,
        createdAt: true,
        ...(currentUserId && {
          followers: {
            where: { followerId: currentUserId }
          }
        }),
        _count: {
          select: { 
            posts: true,
            followers: true,
            following: true,
          }
        }
      }
    });

    if (!user) return null;

    const { followers, _count, ...rest } = user as any;
    return {
      ...rest,
      name: `${user.firstName} ${user.lastName}`,
      followers: _count?.followers || 0,
      following: _count?.following || 0,
      postsCount: _count?.posts || 0,
      isFollowing: followers && followers.length > 0
    };
  }

  async updateProfile(userId: string, data: { bio?: string, country?: string, state?: string, username?: string, avatarUrl?: string, coverUrl?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const updateData: any = { ...data };

    if (data.username && data.username !== user.username) {
      // Check if username is taken
      const existingUser = await this.prisma.user.findUnique({ where: { username: data.username } });
      if (existingUser) {
        throw new BadRequestException('Username is not available');
      }

      // Check 45 days interval
      if (user.lastUsernameChange) {
        const daysSinceChange = (new Date().getTime() - new Date(user.lastUsernameChange).getTime()) / (1000 * 3600 * 24);
        if (daysSinceChange < 45) {
          throw new BadRequestException('You can only change your username once every 45 days');
        }
      }

      updateData.username = data.username;
      updateData.lastUsernameChange = new Date();
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  async followUser(followerId: string, followingUsername: string) {
    const followingUser = await this.findByUsername(followingUsername);
    if (!followingUser) throw new BadRequestException('User not found');
    if (followerId === followingUser.id) throw new BadRequestException('You cannot follow yourself');

    const existingFollow = await this.prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: followingUser.id,
        }
      }
    });

    if (existingFollow) throw new BadRequestException('You are already following this user');

    return this.prisma.follows.create({
      data: {
        followerId,
        followingId: followingUser.id,
      }
    });
  }

  async unfollowUser(followerId: string, followingUsername: string) {
    const followingUser = await this.findByUsername(followingUsername);
    if (!followingUser) throw new BadRequestException('User not found');

    return this.prisma.follows.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId: followingUser.id,
        }
      }
    }).catch(() => {
      throw new BadRequestException('You are not following this user');
    });
  }

  async getFollowers(username: string) {
    const user = await this.findByUsername(username);
    if (!user) throw new BadRequestException('User not found');

    const follows = await this.prisma.follows.findMany({
      where: { followingId: user.id },
      include: {
        follower: {
          select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true, bio: true }
        }
      }
    });
    return follows.map(f => ({ ...f.follower, name: `${f.follower.firstName} ${f.follower.lastName}` }));
  }

  async getFollowing(username: string) {
    const user = await this.findByUsername(username);
    if (!user) throw new BadRequestException('User not found');

    const follows = await this.prisma.follows.findMany({
      where: { followerId: user.id },
      include: {
        following: {
          select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true, bio: true }
        }
      }
    });
    return follows.map(f => ({ ...f.following, name: `${f.following.firstName} ${f.following.lastName}` }));
  }
}
