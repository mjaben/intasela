"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MonetizationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonetizationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MonetizationService = MonetizationService_1 = class MonetizationService {
    prisma;
    logger = new common_1.Logger(MonetizationService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSettings() {
        try {
            const [ratesSetting, rulesSetting] = await Promise.all([
                this.prisma.$queryRaw `SELECT \`value\` FROM SystemSetting WHERE \`key\` = 'monetization_rates'`,
                this.prisma.$queryRaw `SELECT \`value\` FROM SystemSetting WHERE \`key\` = 'monetization_rules'`,
            ]);
            let rates = { sela: 0, resela: 0, reply: 0, viewRpm: 0 };
            if (ratesSetting && ratesSetting.length > 0) {
                rates = typeof ratesSetting[0].value === 'string' ? JSON.parse(ratesSetting[0].value) : ratesSetting[0].value;
            }
            let rules = {
                bannedWords: "",
                minCharacterCount: 15,
                preventDuplicates: true,
                preventSelfReward: true,
                echoChamberLimit: 5,
                hourlyRewardLimit: 10,
                minWithdrawalThreshold: 5000,
            };
            if (rulesSetting && rulesSetting.length > 0) {
                const dbRules = typeof rulesSetting[0].value === 'string' ? JSON.parse(rulesSetting[0].value) : rulesSetting[0].value;
                rules = { ...rules, ...dbRules };
            }
            return { rates, rules };
        }
        catch (error) {
            this.logger.error('Failed to load monetization settings', error);
            return {
                rates: { sela: 0, resela: 0, reply: 0, viewRpm: 0 },
                rules: {
                    bannedWords: "",
                    minCharacterCount: 15,
                    preventDuplicates: true,
                    preventSelfReward: true,
                    echoChamberLimit: 5,
                    hourlyRewardLimit: 10,
                    minWithdrawalThreshold: 5000,
                }
            };
        }
    }
    async validateContent(content, authorId, rules) {
        if (!content)
            return false;
        const strippedContent = content.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]/gu, '');
        if (strippedContent.length < rules.minCharacterCount) {
            return false;
        }
        if (rules.bannedWords && rules.bannedWords.trim().length > 0) {
            const bannedList = rules.bannedWords.split(',').map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
            const lowerContent = content.toLowerCase();
            for (const word of bannedList) {
                if (lowerContent.includes(word)) {
                    return false;
                }
            }
        }
        if (rules.preventDuplicates) {
            const existingPost = await this.prisma.post.findFirst({
                where: {
                    authorId,
                    content
                }
            });
            const duplicateCount = await this.prisma.post.count({
                where: {
                    authorId,
                    content
                }
            });
            if (duplicateCount > 1) {
                return false;
            }
        }
        return true;
    }
    async checkAntiSpam(earnerId, interactorId, type, rules) {
        if (rules.preventSelfReward && earnerId === interactorId && type !== 'POST') {
            return false;
        }
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const hourlyRewards = await this.prisma.transaction.count({
            where: {
                userId: earnerId,
                createdAt: { gte: oneHourAgo },
                type: { in: ['POST', 'REPLY', 'RESELA'] }
            }
        });
        if (hourlyRewards >= rules.hourlyRewardLimit) {
            return false;
        }
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return true;
    }
    async processSelaReward(post) {
        try {
            const { rates, rules } = await this.getSettings();
            if (rates.sela <= 0)
                return;
            const isEligible = await this.validateContent(post.content, post.authorId, rules);
            if (!isEligible)
                return;
            const passesSpam = await this.checkAntiSpam(post.authorId, post.authorId, 'POST', rules);
            if (!passesSpam)
                return;
            await this.prisma.$transaction([
                this.prisma.user.update({
                    where: { id: post.authorId },
                    data: { walletBalance: { increment: rates.sela } }
                }),
                this.prisma.post.update({
                    where: { id: post.id },
                    data: { earned: { increment: rates.sela } }
                }),
                this.prisma.transaction.create({
                    data: {
                        amount: rates.sela,
                        type: 'POST',
                        status: 'COMPLETED',
                        userId: post.authorId,
                        postId: post.id,
                    }
                })
            ]);
            this.logger.log(`Processed SELA reward for post ${post.id}: ${rates.sela}`);
        }
        catch (e) {
            this.logger.error(`Failed to process SELA reward for post ${post.id}`, e);
        }
    }
    async processReplyReward(reply, parent) {
        try {
            const { rates, rules } = await this.getSettings();
            if (rates.reply <= 0)
                return;
            const isEligible = await this.validateContent(reply.content, reply.authorId, rules);
            if (!isEligible)
                return;
            const passesSpam = await this.checkAntiSpam(reply.authorId, parent.authorId, 'REPLY', rules);
            if (!passesSpam)
                return;
            await this.prisma.$transaction([
                this.prisma.user.update({
                    where: { id: reply.authorId },
                    data: { walletBalance: { increment: rates.reply } }
                }),
                this.prisma.post.update({
                    where: { id: reply.id },
                    data: { earned: { increment: rates.reply } }
                }),
                this.prisma.transaction.create({
                    data: {
                        amount: rates.reply,
                        type: 'REPLY',
                        status: 'COMPLETED',
                        userId: reply.authorId,
                        postId: reply.id,
                    }
                })
            ]);
            this.logger.log(`Processed REPLY reward to reply author ${reply.authorId} for reply ${reply.id}: ${rates.reply}`);
        }
        catch (e) {
            this.logger.error(`Failed to process REPLY reward for reply ${reply.id}`, e);
        }
    }
    async processReselaReward(postId, reselaUserId) {
        try {
            const post = await this.prisma.post.findUnique({ where: { id: postId } });
            if (!post)
                return;
            const { rates, rules } = await this.getSettings();
            if (rates.resela <= 0)
                return;
            const passesSpam = await this.checkAntiSpam(post.authorId, reselaUserId, 'RESELA', rules);
            if (!passesSpam)
                return;
            await this.prisma.$transaction([
                this.prisma.user.update({
                    where: { id: post.authorId },
                    data: { walletBalance: { increment: rates.resela } }
                }),
                this.prisma.post.update({
                    where: { id: post.id },
                    data: { earned: { increment: rates.resela } }
                }),
                this.prisma.transaction.create({
                    data: {
                        amount: rates.resela,
                        type: 'RESELA',
                        status: 'COMPLETED',
                        userId: post.authorId,
                        postId: post.id,
                    }
                })
            ]);
            this.logger.log(`Processed RESELA reward for post ${post.id}: ${rates.resela}`);
        }
        catch (e) {
            this.logger.error(`Failed to process RESELA reward for post ${postId}`, e);
        }
    }
    async processViewMilestone(post) {
        try {
            if (post.viewsCount > 0 && post.viewsCount % 1000 === 0) {
                const { rates, rules } = await this.getSettings();
                if (rates.viewRpm <= 0)
                    return;
                await this.prisma.$transaction([
                    this.prisma.user.update({
                        where: { id: post.authorId },
                        data: { walletBalance: { increment: rates.viewRpm } }
                    }),
                    this.prisma.post.update({
                        where: { id: post.id },
                        data: { earned: { increment: rates.viewRpm } }
                    }),
                    this.prisma.transaction.create({
                        data: {
                            amount: rates.viewRpm,
                            type: 'IMPRESSION',
                            status: 'COMPLETED',
                            userId: post.authorId,
                            postId: post.id,
                        }
                    })
                ]);
                this.logger.log(`Processed VIEW RPM reward for post ${post.id} (hit ${post.viewsCount} views): ${rates.viewRpm}`);
            }
        }
        catch (e) {
            this.logger.error(`Failed to process VIEW RPM reward for post ${post.id}`, e);
        }
    }
    async processClawback(postId) {
        try {
            const earnings = await this.prisma.transaction.findMany({
                where: {
                    postId: postId,
                    status: 'COMPLETED',
                    type: { in: ['POST', 'REPLY', 'RESELA', 'IMPRESSION'] }
                }
            });
            if (earnings.length === 0)
                return;
            const userDeductions = {};
            const txIds = [];
            for (const tx of earnings) {
                userDeductions[tx.userId] = (userDeductions[tx.userId] || 0) + tx.amount;
                txIds.push(tx.id);
            }
            const operations = [];
            for (const [userId, amount] of Object.entries(userDeductions)) {
                operations.push(this.prisma.user.update({
                    where: { id: userId },
                    data: { walletBalance: { decrement: amount } }
                }));
            }
            operations.push(this.prisma.transaction.deleteMany({
                where: { id: { in: txIds } }
            }));
            await this.prisma.$transaction(operations);
            this.logger.log(`Processed Clawback for post ${postId}: Deducted earnings from ${Object.keys(userDeductions).length} users.`);
        }
        catch (e) {
            this.logger.error(`Failed to process Clawback for post ${postId}`, e);
        }
    }
};
exports.MonetizationService = MonetizationService;
exports.MonetizationService = MonetizationService = MonetizationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MonetizationService);
//# sourceMappingURL=monetization.service.js.map