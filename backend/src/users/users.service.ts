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

  async searchUsers(query: string) {
    if (!query || query.length < 2) return [];
    
    return this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ]
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true
      },
      take: 10
    });
  }

  async getSuggestedUsers(currentUserId?: string) {
    return this.prisma.user.findMany({
      where: currentUserId ? { id: { not: currentUserId } } : {},
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        bio: true
      },
      take: 6,
      orderBy: { createdAt: 'desc' }
    });
  }

  async getSettings(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { 
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        username: true,
        avatarUrl: true,
        settings: true 
      }
    });
    if (!user) throw new BadRequestException('User not found');
    return user;
  }

  async updateSettings(userId: string, data: any) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        settings: data
      }
    });
  }

  async requestEmailUpdate(userId: string, newEmail: string) {
    // Check if new email is taken
    const existingUser = await this.prisma.user.findUnique({ where: { email: newEmail } });
    if (existingUser) {
      throw new BadRequestException('Email is already in use');
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // In a real app, you would send this via email.
    console.log(`[EMAIL VERIFICATION] OTP for ${newEmail} is: ${otp}`);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        pendingEmail: newEmail,
        emailVerificationOtp: otp,
      }
    });

    return { message: 'OTP generated and sent' };
  }

  async verifyEmailUpdate(userId: string, otp: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    
    if (!user.pendingEmail || user.emailVerificationOtp !== otp) {
      throw new BadRequestException('Invalid OTP or no pending email request');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: user.pendingEmail,
        pendingEmail: null,
        emailVerificationOtp: null
      }
    });

    return { message: 'Email updated successfully', email: user.pendingEmail };
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
          },
          following: {
            where: { followingId: currentUserId }
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

    const { followers, following, _count, ...rest } = user as any;
    return {
      ...rest,
      name: `${user.firstName} ${user.lastName}`,
      followers: _count?.followers || 0,
      followingCount: _count?.following || 0, // renaming to not clash with `following` array
      postsCount: _count?.posts || 0,
      isFollowing: followers && followers.length > 0,
      isFollower: following && following.length > 0
    };
  }

  async getCreatorStudioData(userId: string, period: string = 'all') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true, paymentSettings: true }
    });

    if (!user) throw new BadRequestException('User not found');

    let dateFilter: any = undefined;
    const now = new Date();
    
    if (period === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter = { gte: startOfDay };
    } else if (period === 'yesterday') {
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter = { gte: startOfYesterday, lt: endOfYesterday };
    } else if (period === '7days') {
      const last7Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      dateFilter = { gte: last7Days };
    } else if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { gte: startOfMonth };
    }

    const whereClause: any = { userId };
    const postWhereClause: any = { authorId: userId };
    if (dateFilter) {
      whereClause.createdAt = dateFilter;
      postWhereClause.createdAt = dateFilter;
    }

    const prismaAny = this.prisma as any;

    let transactions = [];
    try {
      transactions = await prismaAny.transaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          post: {
            select: { id: true, content: true }
          }
        }
      });
    } catch (e) {
      console.warn("Transactions table might not be accessible yet", e.message);
    }

    // Analytics Calculation
    const allUserPosts = await this.prisma.post.findMany({
      where: postWhereClause,
      select: { parentId: true, isEligible: true, isFlagged: true, viewsCount: true, createdAt: true }
    });

    const metrics = {
      totalPosts: 0,
      eligiblePosts: 0,
      totalComments: 0,
      eligibleComments: 0,
      totalViews: 0,
      eligibleViews: 0
    };

    const chartMap = new Map<string, { views: number, engagements: number }>();

    for (const post of allUserPosts) {
      const isComment = post.parentId !== null;
      const isEligible = post.isEligible && !post.isFlagged;

      if (isComment) {
        metrics.totalComments++;
        if (isEligible) metrics.eligibleComments++;
      } else {
        metrics.totalPosts++;
        if (isEligible) metrics.eligiblePosts++;
      }

      metrics.totalViews += post.viewsCount;
      if (isEligible) metrics.eligibleViews += post.viewsCount;

      // Add to chart data
      const dateStr = new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const current = chartMap.get(dateStr) || { views: 0, engagements: 0 };
      current.views += post.viewsCount;
      chartMap.set(dateStr, current);
    }

    // Fetch Engagements for the user's posts
    const allEngagements = await this.prisma.engagement.findMany({
       where: { post: { authorId: userId }, ...(dateFilter ? { createdAt: dateFilter } : {}) }
    });
    
    for (const eng of allEngagements) {
       const dateStr = new Date(eng.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
       const current = chartMap.get(dateStr) || { views: 0, engagements: 0 };
       current.engagements += 1;
       chartMap.set(dateStr, current);
    }

    const chartData = Array.from(chartMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const periodEarned = transactions.reduce((acc: number, t: any) => acc + (t.amount || 0), 0);

    return {
      walletBalance: user.walletBalance,
      payoutThreshold: 50000, // ₦50,000 threshold
      paymentSettings: user.paymentSettings,
      metrics,
      periodEarned,
      periodMonetizedPosts: transactions.length,
      history: transactions,
      chartData
    };
  }

  async updateProfile(userId: string, data: { firstName?: string, lastName?: string, phone?: string, bio?: string, country?: string, state?: string, username?: string, avatarUrl?: string, coverUrl?: string }) {
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

    const follow = await this.prisma.follows.create({
      data: {
        followerId,
        followingId: followingUser.id,
      }
    });

    await this.prisma.notification.create({
      data: {
        recipientId: followingUser.id,
        actorId: followerId,
        type: 'FOLLOW',
      }
    });

    return follow;
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

  async deleteAllPosts(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    // Due to onDelete: Cascade on the schema, deleting the posts will cascade to Engagements, Notifications, etc.
    return this.prisma.post.deleteMany({
      where: { authorId: userId }
    });
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    // Due to onDelete: Cascade, this removes all posts, follows, engagements, notifications, and transactions
    return this.prisma.user.delete({
      where: { id: userId }
    });
  }
}
