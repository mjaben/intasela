import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findOne(email: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    findByEmailOrUsername(identifier: string): Promise<User | null>;
    createUser(data: Prisma.UserCreateInput): Promise<User>;
    getProfileByUsername(username: string, currentUserId?: string): Promise<any>;
    updateProfile(userId: string, data: {
        bio?: string;
        country?: string;
        state?: string;
        username?: string;
        avatarUrl?: string;
        coverUrl?: string;
    }): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
        password: string;
        username: string;
        lastUsernameChange: Date | null;
        avatarUrl: string | null;
        coverUrl: string | null;
        walletBalance: number;
        country: string | null;
        state: string | null;
        lga: string | null;
        occupation: string | null;
        bio: string | null;
        creatorType: string | null;
        interests: Prisma.JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    followUser(followerId: string, followingUsername: string): Promise<{
        followerId: string;
        followingId: string;
    }>;
    unfollowUser(followerId: string, followingUsername: string): Promise<{
        followerId: string;
        followingId: string;
    }>;
    getFollowers(username: string): Promise<{
        name: string;
        id: string;
        firstName: string;
        lastName: string;
        username: string;
        avatarUrl: string | null;
        bio: string | null;
    }[]>;
    getFollowing(username: string): Promise<{
        name: string;
        id: string;
        firstName: string;
        lastName: string;
        username: string;
        avatarUrl: string | null;
        bio: string | null;
    }[]>;
}
