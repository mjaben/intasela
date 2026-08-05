import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class MonetizationService {
  private readonly logger = new Logger(MonetizationService.name);

  constructor(private prisma: PrismaService) {}

  async getSettings() {
    try {
      const [ratesSetting, rulesSetting] = await Promise.all([
        this.prisma.systemSetting.findUnique({ where: { key: 'monetization_rates' } }),
        this.prisma.systemSetting.findUnique({ where: { key: 'monetization_rules' } }),
      ]);

      let rates: MonetizationRates = { sela: 10, resela: 5, reply: 2, viewRpm: 1 };
      if (ratesSetting && ratesSetting.value) {
        const dbRates = typeof ratesSetting.value === 'string' ? JSON.parse(ratesSetting.value as string) : ratesSetting.value as unknown as MonetizationRates;
        rates = { ...rates, ...dbRates };
      }

      let rules: MonetizationRules = {
        bannedWords: "",
        minCharacterCount: 5,
        preventDuplicates: true,
        preventSelfReward: true,
        echoChamberLimit: 5,
        hourlyRewardLimit: 10,
        minWithdrawalThreshold: 5000,
      };
      if (rulesSetting && rulesSetting.value) {
        const dbRules = typeof rulesSetting.value === 'string' ? JSON.parse(rulesSetting.value as string) : rulesSetting.value as unknown as MonetizationRules;
        rules = { ...rules, ...dbRules };
      }

      if (!ratesSetting) {
        await this.prisma.systemSetting.upsert({
          where: { key: 'monetization_rates' },
          update: {},
          create: { key: 'monetization_rates', value: rates as any },
        }).catch(() => {});
      }
      if (!rulesSetting) {
        await this.prisma.systemSetting.upsert({
          where: { key: 'monetization_rules' },
          update: {},
          create: { key: 'monetization_rules', value: rules as any },
        }).catch(() => {});
      }

      return { rates, rules };
    } catch (error) {
      this.logger.error('Failed to load monetization settings', error);
      return {
        rates: { sela: 10, resela: 5, reply: 2, viewRpm: 1 },
        rules: {
          bannedWords: "",
          minCharacterCount: 5,
          preventDuplicates: true,
          preventSelfReward: true,
          echoChamberLimit: 5,
          hourlyRewardLimit: 10,
          minWithdrawalThreshold: 5000,
        }
      };
    }
  }

  async validateContent(content: string, authorId: string, rules: MonetizationRules, hasMedia: boolean = false): Promise<boolean> {
    if (!content && !hasMedia) {
      this.logger.warn(`Monetization validation failed: Empty content and no media`);
      return false;
    }

    // 1. Min Character Count (exclude emojis and whitespace) - skip if post has media
    if (!hasMedia && content) {
      const strippedContent = content.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]/gu, '');
      if (strippedContent.length < rules.minCharacterCount) {
        this.logger.warn(`Monetization validation failed for author ${authorId}: stripped content length ${strippedContent.length} < minCharacterCount ${rules.minCharacterCount}`);
        return false;
      }
    }

    // 2. Banned Words
    if (content && rules.bannedWords && rules.bannedWords.trim().length > 0) {
      const bannedList = rules.bannedWords.split(',').map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
      const lowerContent = content.toLowerCase();
      for (const word of bannedList) {
        if (lowerContent.includes(word)) {
          this.logger.warn(`Monetization validation failed for author ${authorId}: content contains banned word '${word}'`);
          return false;
        }
      }
    }

    // 3. Prevent Duplicates
    if (rules.preventDuplicates && content) {
      const duplicateCount = await this.prisma.post.count({
        where: {
          authorId,
          content
        }
      });
      if (duplicateCount > 1) {
        this.logger.warn(`Monetization validation failed for author ${authorId}: duplicate post detected (count: ${duplicateCount})`);
        return false;
      }
    }

    return true;
  }

  async checkAntiSpam(earnerId: string, interactorId: string, type: string, rules: MonetizationRules): Promise<boolean> {
    // 1. Prevent Self-Reward (but not for original Sela creations)
    if (rules.preventSelfReward && earnerId === interactorId && type !== 'POST') {
      this.logger.warn(`AntiSpam failed: self-reward blocked for earner ${earnerId} on type ${type}`);
      return false;
    }

    // 2. Hourly Reward Limit
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourlyRewards = await this.prisma.transaction.count({
      where: {
        userId: earnerId,
        createdAt: { gte: oneHourAgo },
        type: { in: ['POST', 'REPLY', 'RESELA'] }
      }
    });

    if (hourlyRewards >= rules.hourlyRewardLimit) {
      this.logger.warn(`AntiSpam failed for ${earnerId}: hourly rewards limit hit (${hourlyRewards} >= ${rules.hourlyRewardLimit})`);
      return false;
    }

    return true;
  }

  async processSelaReward(post: any) {
    try {
      const { rates, rules } = await this.getSettings();
      if (rates.sela <= 0) return;

      const hasMedia = Boolean(post.mediaUrl || (post.mediaUrls && post.mediaUrls.length > 0));
      const isEligible = await this.validateContent(post.content, post.authorId, rules, hasMedia);
      if (!isEligible) return;

      const passesSpam = await this.checkAntiSpam(post.authorId, post.authorId, 'POST', rules);
      if (!passesSpam) return;

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
    } catch (e) {
      this.logger.error(`Failed to process SELA reward for post ${post.id}`, e);
    }
  }

  async processReplyReward(reply: any, parent: any) {
    try {
      const { rates, rules } = await this.getSettings();
      if (rates.reply <= 0) return;

      const hasMedia = Boolean(reply.mediaUrl || (reply.mediaUrls && reply.mediaUrls.length > 0));
      const isEligible = await this.validateContent(reply.content, reply.authorId, rules, hasMedia);
      if (!isEligible) return;

      const passesSpam = await this.checkAntiSpam(reply.authorId, parent.authorId, 'REPLY', rules);
      if (!passesSpam) return;

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
    } catch (e) {
      this.logger.error(`Failed to process REPLY reward for reply ${reply.id}`, e);
    }
  }

  async processReselaReward(postId: number, reselaUserId: string) {
    try {
      const post = await this.prisma.post.findUnique({ where: { id: postId } });
      if (!post) return;

      const { rates, rules } = await this.getSettings();
      if (rates.resela <= 0) return;

      const passesSpam = await this.checkAntiSpam(post.authorId, reselaUserId, 'RESELA', rules);
      if (!passesSpam) return;

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
    } catch (e) {
      this.logger.error(`Failed to process RESELA reward for post ${postId}`, e);
    }
  }

  async processViewMilestone(post: any) {
    try {
      // If we just hit a multiple of 1000 views
      if (post.viewsCount > 0 && post.viewsCount % 1000 === 0) {
        const { rates, rules } = await this.getSettings();
        if (rates.viewRpm <= 0) return;

        // Ensure we don't reward if self-reward is blocked (though view tracking is anonymous, 
        // we can't easily prevent self-view farming here without IP tracking, so we just award RPM)
        
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
    } catch (e) {
      this.logger.error(`Failed to process VIEW RPM reward for post ${post.id}`, e);
    }
  }

  async processClawback(postId: number) {
    try {
      // Find all completed earnings transactions tied to this post (Sela, Reply, Resela, Impression)
      const earnings = await this.prisma.transaction.findMany({
        where: {
          postId: postId,
          status: 'COMPLETED',
          type: { in: ['POST', 'REPLY', 'RESELA', 'IMPRESSION'] }
        }
      });

      if (earnings.length === 0) return;

      // Group earnings by user so we can subtract effectively
      const userDeductions: Record<string, number> = {};
      const txIds: number[] = [];

      for (const tx of earnings) {
        userDeductions[tx.userId] = (userDeductions[tx.userId] || 0) + tx.amount;
        txIds.push(tx.id);
      }

      // Process deductions
      const operations: any[] = [];
      for (const [userId, amount] of Object.entries(userDeductions)) {
        operations.push(
          this.prisma.user.update({
            where: { id: userId },
            data: { walletBalance: { decrement: amount } }
          })
        );
      }

      // Delete the transactions so they no longer appear on statements
      operations.push(
        this.prisma.transaction.deleteMany({
          where: { id: { in: txIds } }
        })
      );

      await this.prisma.$transaction(operations);

      this.logger.log(`Processed Clawback for post ${postId}: Deducted earnings from ${Object.keys(userDeductions).length} users.`);
    } catch (e) {
      this.logger.error(`Failed to process Clawback for post ${postId}`, e);
    }
  }
}
