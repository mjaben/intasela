import { PostsService } from './posts.service';
export declare class PostsController {
    private readonly postsService;
    constructor(postsService: PostsService);
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
    createPost(req: any, body: {
        content: string;
    }): Promise<{
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
