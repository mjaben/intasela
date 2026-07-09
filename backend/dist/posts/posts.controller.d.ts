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
    toggleEngagement(req: any, id: string, body: {
        type: string;
    }): Promise<{
        status: string;
    }>;
    incrementView(id: string): Promise<{
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
    deletePost(req: any, id: string): Promise<{
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
