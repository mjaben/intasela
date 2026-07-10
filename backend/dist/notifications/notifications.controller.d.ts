import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(req: any): Promise<({
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
    getUnreadCount(req: any): Promise<{
        count: number;
    }>;
    markAsRead(req: any): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
