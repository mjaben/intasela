import { PrismaService } from '../prisma/prisma.service';
export declare class PostsService {
    private prisma;
    constructor(prisma: PrismaService);
    getFeed(): Promise<({
        _count: {
            engagements: number;
        };
        author: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            avatarUrl: string | null;
            creatorType: string | null;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        earned: number;
        authorId: string;
    })[]>;
    createPost(userId: string, content: string): Promise<{
        _count: {
            engagements: number;
        };
        author: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
            avatarUrl: string | null;
            creatorType: string | null;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        earned: number;
        authorId: string;
    }>;
}
