import { Controller, Get, Post, Body, Req, UseGuards, Param } from '@nestjs/common';
import { AdsService } from './ads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Assuming standard NestJS auth
import { PrismaService } from '../prisma/prisma.service';

@Controller('ads')
export class AdsController {
  constructor(
    private readonly adsService: AdsService,
    private readonly prisma: PrismaService
  ) {}

  @Get('settings/public')
  async getPublicSettings() {
    return this.adsService.getPublicSettings();
  }

  @Get('decide')
  async decideAd(@Req() req: any) {
    const userContext = {
      userId: req.user?.id,
      device: req.headers['user-agent'],
    };
    return this.adsService.decideAd(userContext);
  }

  @Post('track/impression')
  async trackImpression(
    @Req() req: any,
    @Body() body: { campaignId: string, cost: number, device?: string, country?: string }
  ) {
    return this.adsService.trackImpression({
      campaignId: body.campaignId,
      userId: req.user?.id,
      device: body.device || req.headers['user-agent'],
      country: body.country,
      cost: body.cost
    });
  }

  @Post('track/click')
  async trackClick(
    @Req() req: any,
    @Body() body: { campaignId: string, cost: number }
  ) {
    return this.adsService.trackClick({
      campaignId: body.campaignId,
      userId: req.user?.id,
      ip: req.ip,
      cost: body.cost
    });
  }

  // --- PHASE 2: ADVERTISER PORTAL ENDPOINTS ---

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyAdvertiserProfile(@Req() req: any) {
    const advertiser = await this.adsService.getOrCreateAdvertiser(req.user.id, req.user.email, req.user.name);
    const campaigns = await this.prisma.campaign.findMany({ 
      where: { advertiserId: advertiser.id },
      include: { creatives: true }
    });
    return { ...advertiser, campaigns };
  }

  @UseGuards(JwtAuthGuard)
  @Get('wallet/balance')
  async getWalletBalance(@Req() req: any) {
    const advertiser = await this.adsService.getOrCreateAdvertiser(req.user.id, req.user.email, req.user.name);
    return { balance: advertiser.adWalletBalance };
  }

  @UseGuards(JwtAuthGuard)
  @Get('wallet/transactions')
  async getWalletTransactions(@Req() req: any) {
    const advertiser = await this.adsService.getOrCreateAdvertiser(req.user.id, req.user.email, req.user.name);
    return this.prisma.advertiserTransaction.findMany({
      where: { advertiserId: advertiser.id },
      orderBy: { createdAt: 'desc' }
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('wallet/fund')
  async fundWallet(
    @Req() req: any,
    @Body() body: { amount: number, reference: string }
  ) {
    const advertiser = await this.adsService.getOrCreateAdvertiser(req.user.id, req.user.email, req.user.name);
    return this.adsService.requestManualFunding(advertiser.id, body.amount, body.reference);
  }

  @UseGuards(JwtAuthGuard)
  @Post('campaigns')
  async createCampaign(
    @Req() req: any,
    @Body() body: { campaignData: any, creativeData: any }
  ) {
    const advertiser = await this.adsService.getOrCreateAdvertiser(req.user.id, req.user.email, req.user.name);
    return this.adsService.createCampaign(advertiser.id, body.campaignData, body.creativeData);
  }
}

// --- PHASE 2: ADMIN ENDPOINTS ---
@Controller('admin/ads')
export class AdminAdsController {
  constructor(
    private readonly adsService: AdsService,
    private readonly prisma: PrismaService
  ) {}

  // NOTE: In production, apply a @UseGuards(AdminAuthGuard) here

  @Get('funding/pending')
  async getPendingFunding() {
    return this.prisma.advertiserTransaction.findMany({
      where: { type: 'MANUAL_FUNDING', status: 'PENDING' },
      include: { advertiser: true }
    });
  }

  @Post('funding/approve/:id')
  async approveFunding(@Param('id') id: string) {
    return this.adsService.approveFunding(id);
  }

  @Post('funding/reject/:id')
  async rejectFunding(@Param('id') id: string) {
    return this.adsService.rejectFunding(id);
  }

  @Get('funding/requests')
  async getAllFundingRequests() {
    return this.prisma.advertiserTransaction.findMany({
      where: { type: 'MANUAL_FUNDING' },
      include: { advertiser: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Get('campaigns')
  async getAllCampaigns() {
    return this.prisma.campaign.findMany({
      include: { advertiser: true, creatives: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Get('campaigns/pending')
  async getPendingCampaigns() {
    return this.prisma.campaign.findMany({
      where: { status: 'PENDING' },
      include: { advertiser: true, creatives: true }
    });
  }

  @Get('campaigns/active')
  async getActiveCampaigns() {
    return this.prisma.campaign.findMany({
      where: { status: 'ACTIVE' },
      include: { advertiser: true, creatives: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Post('campaigns/approve/:id')
  async approveCampaign(@Param('id') id: string) {
    return this.adsService.approveCampaign(id);
  }

  @Post('campaigns/reject/:id')
  async rejectCampaign(@Param('id') id: string) {
    return this.adsService.rejectCampaign(id);
  }

  @Get('settings')
  async getSettings() {
    const minCpmSetting = await this.prisma.systemSetting.findUnique({
      where: { key: 'min_cpm_rate' }
    });
    const googleCpmSetting = await this.prisma.systemSetting.findUnique({
      where: { key: 'google_estimated_cpm' }
    });
    const minBudgetSetting = await this.prisma.systemSetting.findUnique({
      where: { key: 'min_campaign_budget' }
    });
    const maxBudgetSetting = await this.prisma.systemSetting.findUnique({
      where: { key: 'max_campaign_budget' }
    });
    const businessSetting = await this.prisma.systemSetting.findUnique({
      where: { key: 'business_ads_enabled' }
    });
    return {
      minCpmRate: minCpmSetting ? Number(minCpmSetting.value) : 100,
      googleCpm: googleCpmSetting ? Number(googleCpmSetting.value) : 1000,
      minBudget: minBudgetSetting ? Number(minBudgetSetting.value) : 2000,
      maxBudget: maxBudgetSetting ? Number(maxBudgetSetting.value) : 5000000,
      businessAdsEnabled: businessSetting ? (businessSetting.value === true || businessSetting.value === 'true') : true
    };
  }

  @Post('settings')
  async saveSettings(@Body() body: { minCpmRate: number, googleCpm: number, minBudget: number, maxBudget: number, businessAdsEnabled: boolean }) {
    return this.adsService.updateEngineSettings(body.minCpmRate, body.googleCpm, body.minBudget, body.maxBudget, body.businessAdsEnabled);
  }
}
