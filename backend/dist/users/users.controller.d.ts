import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';
export declare class UsersController {
    private readonly usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    getProfile(username: string, authHeader?: string): Promise<any>;
    updateProfile(req: any, updateData: {
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
        interests: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
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
}
