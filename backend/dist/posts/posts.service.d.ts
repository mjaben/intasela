import { PrismaService } from '../prisma/prisma.service';
export declare class PostsService {
    private prisma;
    constructor(prisma: PrismaService);
    private getAuthorSelect;
    getFeed(currentUserId?: string): Promise<any[]>;
    getPostsByUsername(username: string, currentUserId?: string): Promise<any[]>;
    getRepliesByUsername(username: string, currentUserId?: string): Promise<any[]>;
    getLikesByUsername(username: string, currentUserId?: string): Promise<any[]>;
    private formatPost;
    getPostById(postId: number, currentUserId?: string): Promise<any>;
    createPost(userId: string, content: string, parentId?: number, quotedPostId?: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        earned: number;
        viewsCount: number;
        conversationId: number | null;
        parentId: number | null;
        quotedPostId: number | null;
        authorId: string;
    }>;
    toggleEngagement(userId: string, postId: number, type: string): Promise<{
        status: string;
    }>;
    incrementView(postId: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        earned: number;
        viewsCount: number;
        conversationId: number | null;
        parentId: number | null;
        quotedPostId: number | null;
        authorId: string;
    }>;
    deletePost(postId: number, userId: string): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        earned: number;
        viewsCount: number;
        conversationId: number | null;
        parentId: number | null;
        quotedPostId: number | null;
        authorId: string;
    }>;
}
