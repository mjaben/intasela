import { PostsService } from './posts.service';
import { JwtService } from '@nestjs/jwt';
export declare class PostsController {
    private readonly postsService;
    private jwtService;
    constructor(postsService: PostsService, jwtService: JwtService);
    getFeed(authHeader: string): Promise<any[]>;
    getPostsByUsername(username: string, authHeader: string): Promise<any[]>;
    getRepliesByUsername(username: string, authHeader: string): Promise<any[]>;
    getLikesByUsername(username: string, authHeader: string): Promise<any[]>;
    getPostById(id: string, authHeader: string): Promise<any>;
    createPost(req: any, body: {
        content: string;
        parentId?: number;
        quotedPostId?: number;
    }): Promise<{
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
    toggleEngagement(req: any, id: string, body: {
        type: string;
    }): Promise<{
        status: string;
    }>;
    incrementView(id: string): Promise<{
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
    deletePost(req: any, id: string): Promise<{
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
