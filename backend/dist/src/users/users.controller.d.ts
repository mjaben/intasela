import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';
export declare class UsersController {
    private readonly usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    getProfile(username: string, authHeader?: string): Promise<any>;
    getSettings(req: any): Promise<{
        email: string;
        firstName: string;
        lastName: string;
        username: string;
        phone: string | null;
        avatarUrl: string | null;
        settings: import("@prisma/client/runtime/library").JsonValue;
    }>;
    updateSettings(req: any, data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
        username: string;
        pendingEmail: string | null;
        emailVerificationOtp: string | null;
        phone: string | null;
        lastUsernameChange: Date | null;
        avatarUrl: string | null;
        coverUrl: string | null;
        walletBalance: number;
        country: string | null;
        state: string | null;
        lga: string | null;
        occupation: string | null;
        gender: string | null;
        bio: string | null;
        creatorType: string | null;
        interests: import("@prisma/client/runtime/library").JsonValue | null;
        paymentSettings: import("@prisma/client/runtime/library").JsonValue | null;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
        isSuspended: boolean;
        isShadowBanned: boolean;
        isSpaceMod: boolean;
    }>;
    requestEmailUpdate(req: any, data: {
        newEmail: string;
    }): Promise<{
        message: string;
    }>;
    verifyEmailUpdate(req: any, data: {
        otp: string;
    }): Promise<{
        message: string;
        email: string;
    }>;
    getCreatorStudio(req: any, period?: string): Promise<{
        walletBalance: number;
        payoutThreshold: number;
        paymentSettings: import("@prisma/client/runtime/library").JsonValue;
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
    updateProfile(req: any, updateData: {
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
        createdAt: Date;
        updatedAt: Date;
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
        username: string;
        pendingEmail: string | null;
        emailVerificationOtp: string | null;
        phone: string | null;
        lastUsernameChange: Date | null;
        avatarUrl: string | null;
        coverUrl: string | null;
        walletBalance: number;
        country: string | null;
        state: string | null;
        lga: string | null;
        occupation: string | null;
        gender: string | null;
        bio: string | null;
        creatorType: string | null;
        interests: import("@prisma/client/runtime/library").JsonValue | null;
        paymentSettings: import("@prisma/client/runtime/library").JsonValue | null;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
        isSuspended: boolean;
        isShadowBanned: boolean;
        isSpaceMod: boolean;
    }>;
    followUser(req: any, username: string): Promise<{
        followerId: string;
        followingId: string;
    }>;
    unfollowUser(req: any, username: string): Promise<{
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
    deleteAllPosts(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteAccount(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
