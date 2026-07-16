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

  // --- PHASE 2: WALLET & CAMPAIGN MANAGEMENT ---

  async getOrCreateAdvertiser(userId: string, email: string, name: string) {
    let advertiser = await this.prisma.advertiser.findFirst({ where: { userId } });
    if (!advertiser) {
      advertiser = await this.prisma.advertiser.create({
        data: {
          userId,
          email,
          companyName: name || 'My Business',
        }
      });
    }
    return advertiser;
  }

  async requestManualFunding(advertiserId: string, amount: number, reference: string) {
    return this.prisma.advertiserTransaction.create({
      data: {
        advertiserId,
        amount,
        type: 'MANUAL_FUNDING',
        status: 'PENDING',
        reference
      }
    });
  }

  async approveFunding(transactionId: string) {
    const tx = await this.prisma.advertiserTransaction.findUnique({ where: { id: transactionId } });
    if (!tx || tx.status !== 'PENDING') throw new Error("Invalid transaction");

    // Start a Prisma transaction to ensure atomicity
    return this.prisma.$transaction(async (prisma) => {
      // 1. Mark TX as completed
      const updatedTx = await prisma.advertiserTransaction.update({
        where: { id: transactionId },
        data: { status: 'COMPLETED' }
      });

      // 2. Increment Wallet Balance
      await prisma.advertiser.update({
        where: { id: tx.advertiserId },
        data: { adWalletBalance: { increment: tx.amount } }
      });

      return updatedTx;
    });
  }

  async createCampaign(advertiserId: string, campaignData: any, creativeData: any) {
    const advertiser = await this.prisma.advertiser.findUnique({ where: { id: advertiserId } });
    if (!advertiser || advertiser.adWalletBalance < campaignData.budget) {
      throw new Error("Insufficient ad wallet balance.");
    }

    return this.prisma.$transaction(async (prisma) => {
      // 1. Deduct budget from wallet
      await prisma.advertiser.update({
        where: { id: advertiserId },
        data: { adWalletBalance: { decrement: campaignData.budget } }
      });

      // 2. Record the spend transaction
      await prisma.advertiserTransaction.create({
        data: {
          advertiserId,
          amount: campaignData.budget,
          type: 'CAMPAIGN_SPEND',
          status: 'COMPLETED',
          reference: `Funded Campaign: ${campaignData.name}`
        }
      });

      // 3. Create Campaign and Creative
      return prisma.campaign.create({
        data: {
          advertiserId,
          name: campaignData.name,
          budget: campaignData.budget,
          remainingBudget: campaignData.budget,
          status: 'PENDING', // Awaiting Admin Approval
          bid: campaignData.bid,
          objective: campaignData.objective,
          startDate: new Date(campaignData.startDate),
          endDate: campaignData.endDate ? new Date(campaignData.endDate) : null,
          targetCountry: campaignData.targetCountry,
          creatives: {
            create: {
              mediaUrl: creativeData.mediaUrl,
              mediaType: creativeData.mediaType,
              headline: creativeData.headline,
              description: creativeData.description,
              ctaText: creativeData.ctaText,
              ctaLink: creativeData.ctaLink
            }
          }
        },
        include: { creatives: true }
      });
    });
  }

  async approveCampaign(campaignId: string) {
    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'ACTIVE' }
    });
  }
}
