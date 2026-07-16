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
   * The Ad Decision Engine: Second-Price Auction
   * Filters by budget, targeting, calculates Ad Score, and determines winner & cost.
   */
  async decideAd(userContext: any = {}) {
    try {
      // 1. Fetch Minimum Ad Rate from Settings
      const minCpmSetting = await this.prisma.systemSetting.findUnique({
        where: { key: 'min_cpm_rate' },
      });
      const minCpm = minCpmSetting ? Number(minCpmSetting.value) : 100; // Default 100 NGN

      // 2. Fetch Active Internal Campaigns with Budget Remaining
      let activeCampaigns = await this.prisma.campaign.findMany({
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

      // 3. Simple Targeting Filter (MVP)
      // Check if campaign targets match userContext (if provided)
      if (userContext.interests && userContext.interests.length > 0) {
        activeCampaigns = activeCampaigns.filter(c => {
          if (!c.interests) return true; // Broad targeting
          const campaignInterests = c.interests.toLowerCase();
          return userContext.interests.some((i: string) => campaignInterests.includes(i.toLowerCase()));
        });
      }

      // 4. Calculate Pacing, Shadow Bids, and eCPM
      const now = Date.now();
      const campaignsWithScores = activeCampaigns.map(campaign => {
        // Pacing Calculation
        const start = campaign.startDate.getTime();
        const end = campaign.endDate ? campaign.endDate.getTime() : start + (4 * 24 * 60 * 60 * 1000); // fallback 4 days
        const totalDurationMs = Math.max(end - start, 1);
        const elapsedMs = Math.max(now - start, 0);
        const expectedSpendRatio = Math.min(elapsedMs / totalDurationMs, 1);
        
        const expectedSpend = campaign.budget * expectedSpendRatio;
        const actualSpend = campaign.budget - campaign.remainingBudget;
        
        // Urgency: > 0 means underspending, < 0 means overspending
        const urgencyDeficit = expectedSpend - actualSpend;
        const urgencyRatio = urgencyDeficit / campaign.budget;
        
        const urgencyMultiplier = 1 + (urgencyRatio * 5); // Pacing multiplier

        // Billing Model & eCPM Conversion
        const billingModel = campaign.objective === 'AWARENESS' ? 'CPM' : 'CPC';
        const expectedCtr = 0.015; // 1.5% baseline CTR
        const qualityScore = 5.0; // MVP default

        let shadowBid = 0;
        let eCPM = 0;

        if (billingModel === 'CPM') {
          const baseCpmBid = minCpm;
          shadowBid = baseCpmBid * urgencyMultiplier;
          eCPM = shadowBid;
        } else {
          const baseCpcBid = minCpm / (expectedCtr * 1000);
          shadowBid = baseCpcBid * urgencyMultiplier;
          eCPM = shadowBid * expectedCtr * 1000;
        }

        // Disqualify if severely overspending (drops below floor)
        if (eCPM < minCpm && urgencyRatio < -0.05) {
          eCPM = 0; 
        }

        const adScore = eCPM * qualityScore;

        return {
          ...campaign,
          billingModel,
          shadowBid,
          eCPM,
          qualityScore,
          adScore
        };
      }).filter(c => c.eCPM >= minCpm); // Only allow ads that meet the floor eCPM

      if (campaignsWithScores.length === 0) {
        return { type: 'google', reason: 'No eligible internal campaigns after pacing' };
      }

      // 5. Sort by Ad Score Descending
      campaignsWithScores.sort((a, b) => b.adScore - a.adScore);

      const winner = campaignsWithScores[0];
      const runnerUp = campaignsWithScores.length > 1 ? campaignsWithScores[1] : null;

      // 6. Charging (Second-Price Rule based on eCPM)
      const runnerUpScore = runnerUp ? runnerUp.adScore : (minCpm * winner.qualityScore);
      const costPaidECPM = (runnerUpScore / winner.qualityScore) + 0.01;
      
      let costToCharge = 0;
      if (winner.billingModel === 'CPM') {
        costToCharge = Math.max(costPaidECPM, minCpm);
      } else {
        const expectedCtr = 0.015; // 1.5% baseline CTR
        const minCpc = minCpm / (expectedCtr * 1000);
        const costPaidCPC = costPaidECPM / (expectedCtr * 1000);
        costToCharge = Math.max(costPaidCPC, minCpc);
      }

      const creative = winner.creatives[Math.floor(Math.random() * winner.creatives.length)];
      
      return {
        type: 'internal',
        campaignId: winner.id,
        creative: creative,
        billingModel: winner.billingModel,
        cost: costToCharge, // CPC or CPM cost depending on model
        cpm: winner.billingModel === 'CPM' ? costToCharge : costPaidECPM // Keep legacy cpm prop just in case frontend relies on it
      };


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

  async trackClick(data: { campaignId: string, userId?: string, ip?: string, cost?: number }) {
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

  async rejectFunding(transactionId: string) {
    const tx = await this.prisma.advertiserTransaction.findUnique({ where: { id: transactionId } });
    if (!tx || tx.status !== 'PENDING') throw new Error("Invalid transaction");

    return this.prisma.advertiserTransaction.update({
      where: { id: transactionId },
      data: { status: 'REJECTED' }
    });
  }

  async createCampaign(advertiserId: string, campaignData: any, creativeData: any) {
    const advertiser = await this.prisma.advertiser.findUnique({ where: { id: advertiserId } });
    
    // Calculate VAT (7.5%)
    const vatAmount = campaignData.budget * 0.075;
    const totalAmountDue = campaignData.budget + vatAmount;

    if (!advertiser || advertiser.adWalletBalance < totalAmountDue) {
      throw new Error(`Insufficient ad wallet balance. You need ₦${totalAmountDue} (incl. VAT).`);
    }

    return this.prisma.$transaction(async (prisma) => {
      // 1. Deduct total amount (Budget + VAT) from wallet
      await prisma.advertiser.update({
        where: { id: advertiserId },
        data: { adWalletBalance: { decrement: totalAmountDue } }
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
          dailyBudget: campaignData.dailyBudget || null,
          remainingBudget: campaignData.budget,
          status: 'PENDING', // Awaiting Admin Approval
          bid: campaignData.bid,
          objective: campaignData.objective,
          startDate: new Date(campaignData.startDate),
          endDate: campaignData.endDate ? new Date(campaignData.endDate) : null,
          targetCountry: campaignData.targetCountry,
          targetStates: campaignData.targetStates ? JSON.stringify(campaignData.targetStates) : null,
          targetAge: campaignData.targetAge,
          targetGender: campaignData.targetGender,
          interests: campaignData.interests ? JSON.stringify(campaignData.interests) : null,
          keywords: campaignData.keywords ? JSON.stringify(campaignData.keywords) : null,
          creatives: {
            create: {
              postId: creativeData.postId ? Number(creativeData.postId) : null,
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

  async rejectCampaign(campaignId: string) {
    const campaign = await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'REJECTED' }
    });

    // Refund wallet
    await this.prisma.advertiser.update({
      where: { id: campaign.advertiserId },
      data: { adWalletBalance: { increment: campaign.budget } }
    });
    
    // Add refund transaction
    await this.prisma.advertiserTransaction.create({
      data: {
        advertiserId: campaign.advertiserId,
        amount: campaign.budget,
        type: 'MANUAL_FUNDING', // Reusing this for refund, or create REFUND type
        status: 'COMPLETED',
        reference: `Refund for Rejected Campaign: ${campaign.name}`
      }
    });

    return campaign;
  }

  async updateEngineSettings(minCpmRate: number, googleCpm: number, minBudget: number, maxBudget: number, businessAdsEnabled: boolean) {
    await this.prisma.systemSetting.upsert({
      where: { key: 'min_cpm_rate' },
      update: { value: minCpmRate },
      create: { key: 'min_cpm_rate', value: minCpmRate }
    });

    await this.prisma.systemSetting.upsert({
      where: { key: 'google_estimated_cpm' },
      update: { value: googleCpm },
      create: { key: 'google_estimated_cpm', value: googleCpm }
    });

    await this.prisma.systemSetting.upsert({
      where: { key: 'min_campaign_budget' },
      update: { value: minBudget },
      create: { key: 'min_campaign_budget', value: minBudget }
    });

    await this.prisma.systemSetting.upsert({
      where: { key: 'max_campaign_budget' },
      update: { value: maxBudget },
      create: { key: 'max_campaign_budget', value: maxBudget }
    });

    return this.prisma.systemSetting.upsert({
      where: { key: 'business_ads_enabled' },
      update: { value: businessAdsEnabled },
      create: { key: 'business_ads_enabled', value: businessAdsEnabled }
    });
  }

  async getPublicSettings() {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'business_ads_enabled' }
    });
    const cpmSetting = await this.prisma.systemSetting.findUnique({
      where: { key: 'min_cpm_rate' }
    });
    const minBudgetSetting = await this.prisma.systemSetting.findUnique({
      where: { key: 'min_campaign_budget' }
    });
    const maxBudgetSetting = await this.prisma.systemSetting.findUnique({
      where: { key: 'max_campaign_budget' }
    });
    return {
      businessAdsEnabled: setting ? setting.value === true || setting.value === 'true' : true, // Default to true
      min_cpm_rate: cpmSetting ? Number(cpmSetting.value) : 100,
      min_budget: minBudgetSetting ? Number(minBudgetSetting.value) : 2000,
      max_budget: maxBudgetSetting ? Number(maxBudgetSetting.value) : 5000000
    };
  }
}
