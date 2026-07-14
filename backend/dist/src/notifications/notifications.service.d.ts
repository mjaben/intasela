import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsService {
    private prisma;
    constructor(prisma: PrismaService);
    getNotifications(userId: string): Promise<({
        post: {
            content: string;
        } | null;
        actor: {
            firstName: string;
            username: string;
            avatarUrl: string | null;
        };
    } & {
        id: number;
        createdAt: Date;
        type: string;
        postId: number | null;
        isRead: boolean;
        actorId: string;
        recipientId: string;
    })[]>;
    markAsRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getUnreadCount(userId: string): Promise<{
        count: number;
    }>;
}
