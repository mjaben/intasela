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
        parent: {
            id: number;
            content: string;
            authorId: string;
            earned: number;
            viewsCount: number;
            parentId: number | null;
            conversationId: number | null;
            quotedPostId: number | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        quotedPost: {
            id: number;
            content: string;
            authorId: string;
            earned: number;
            viewsCount: number;
            parentId: number | null;
            conversationId: number | null;
            quotedPostId: number | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: number;
        content: string;
        authorId: string;
        earned: number;
        viewsCount: number;
        parentId: number | null;
        conversationId: number | null;
        quotedPostId: number | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    toggleEngagement(userId: string, postId: number, type: string): Promise<{
        status: string;
    }>;
    incrementView(postId: number): Promise<{
        id: number;
        content: string;
        authorId: string;
        earned: number;
        viewsCount: number;
        parentId: number | null;
        conversationId: number | null;
        quotedPostId: number | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deletePost(postId: number, userId: string): Promise<{
        id: number;
        content: string;
        authorId: string;
        earned: number;
        viewsCount: number;
        parentId: number | null;
        conversationId: number | null;
        quotedPostId: number | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
