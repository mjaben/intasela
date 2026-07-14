import { PrismaService } from '../prisma/prisma.service';
export type MonetizationRates = {
    sela: number;
    resela: number;
    reply: number;
    viewRpm: number;
};
export type MonetizationRules = {
    bannedWords: string;
    minCharacterCount: number;
    preventDuplicates: boolean;
    preventSelfReward: boolean;
    echoChamberLimit: number;
    hourlyRewardLimit: number;
    minWithdrawalThreshold: number;
};
export declare class MonetizationService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getSettings(): Promise<{
        rates: MonetizationRates;
        rules: MonetizationRules;
    }>;
    validateContent(content: string, authorId: string, rules: MonetizationRules): Promise<boolean>;
    checkAntiSpam(earnerId: string, interactorId: string, type: string, rules: MonetizationRules): Promise<boolean>;
    processSelaReward(post: any): Promise<void>;
    processReplyReward(reply: any, parent: any): Promise<void>;
    processReselaReward(postId: number, reselaUserId: string): Promise<void>;
    processViewMilestone(post: any): Promise<void>;
    processClawback(postId: number): Promise<void>;
}
