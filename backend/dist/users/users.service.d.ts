import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findOne(email: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    findByEmailOrUsername(identifier: string): Promise<User | null>;
    getSettings(userId: string): Promise<{
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
        username: string;
        avatarUrl: string | null;
        settings: Prisma.JsonValue;
    }>;
    updateSettings(userId: string, data: any): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        pendingEmail: string | null;
        emailVerificationOtp: string | null;
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
        paymentSettings: Prisma.JsonValue | null;
        settings: Prisma.JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    requestEmailUpdate(userId: string, newEmail: string): Promise<{
        message: string;
    }>;
    verifyEmailUpdate(userId: string, otp: string): Promise<{
        message: string;
        email: string;
    }>;
    createUser(data: Prisma.UserCreateInput): Promise<User>;
    getProfileByUsername(username: string, currentUserId?: string): Promise<any>;
    getCreatorStudioData(userId: string, period?: string): Promise<{
        walletBalance: number;
        payoutThreshold: number;
        paymentSettings: Prisma.JsonValue;
        metrics: {
            totalPosts: number;
            eligiblePosts: number;
            totalComments: number;
            eligibleComments: number;
            totalViews: number;
            eligibleViews: number;
        };
        periodEarned: any;
        periodMonetizedPosts: any;
        history: any;
        chartData: {
            views: number;
            engagements: number;
            date: string;
        }[];
    }>;
    updateProfile(userId: string, data: {
        firstName?: string;
        lastName?: string;
        phone?: string;
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
        pendingEmail: string | null;
        emailVerificationOtp: string | null;
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
        paymentSettings: Prisma.JsonValue | null;
        settings: Prisma.JsonValue | null;
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
