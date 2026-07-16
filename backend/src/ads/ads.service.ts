import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AdsService {
  private readonly logger = new Logger(AdsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('ad-tracking') private readonly trackingQueue: Queue,
  ) {}

  /**
   * The Ad Decision Engine
   * Compares internal active campaigns against estimated Google CPM.
   */
  async decideAd(userContext: any) {
    try {
      // 1. Fetch System Settings for Historic Google CPM
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'google_estimated_cpm' },
      });
      const googleCpm = setting ? Number(setting.value) : 1.50; // Default $1.50 CPM

      // 2. Fetch Active Internal Campaigns with Budget Remaining
      const activeCampaigns = await this.prisma.campaign.findMany({
        where: {
          status: 'ACTIVE',
          remainingBudget: { gt: 0 },
          startDate: { lte: new Date() },
          OR: [
            { endDate: null },
            { endDate: { gte: new Date() } }
          ]
        },
        include: {
          creatives: true
        }
      });

      // Filter campaigns by targeting (simplified for now)
      // Future: Add frequency cap checking via Redis here

      if (activeCampaigns.length === 0) {
        return { type: 'google', reason: 'No internal campaigns available' };
      }

      // 3. Find the highest bidding internal campaign
      const highestBidCampaign = activeCampaigns.reduce((prev, current) => {
        return (prev.bid > current.bid) ? prev : current;
      });

      // 4. Compare with Google CPM
      if (highestBidCampaign.bid > googleCpm) {
        // Internal wins
        const creative = highestBidCampaign.creatives[Math.floor(Math.random() * highestBidCampaign.creatives.length)];
        
        return {
          type: 'internal',
          campaignId: highestBidCampaign.id,
          creative: creative,
          cpm: highestBidCampaign.bid
        };
      }

      // Google wins
      return { type: 'google', reason: 'Google CPM won the auction' };
    } catch (error) {
      this.logger.error('Error in Ad Decision Engine', error);
      // Fallback to Google if the engine fails
      return { type: 'google', reason: 'Engine Error' };
    }
  }

  async trackImpression(data: { campaignId: string, userId?: string, device?: string, country?: string, cost: number }) {
    await this.trackingQueue.add('impression', data);
    return { success: true };
  }

  async trackClick(data: { campaignId: string, userId?: string, ip?: string }) {
    await this.trackingQueue.add('click', data);
    return { success: true };
  }
}
