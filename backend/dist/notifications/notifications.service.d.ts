import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsService {
    private prisma;
    constructor(prisma: PrismaService);
    getNotifications(userId: string): Promise<({
        actor: {
            firstName: string;
            username: string;
            avatarUrl: string | null;
        };
        post: {
            content: string;
        } | null;
    } & {
        id: number;
        recipientId: string;
        actorId: string;
        type: string;
        postId: number | null;
        isRead: boolean;
        createdAt: Date;
    })[]>;
    markAsRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getUnreadCount(userId: string): Promise<{
        count: number;
    }>;
}
