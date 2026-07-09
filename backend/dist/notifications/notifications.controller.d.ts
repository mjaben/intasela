import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(req: any): Promise<({
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
    getUnreadCount(req: any): Promise<{
        count: number;
    }>;
    markAsRead(req: any): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
