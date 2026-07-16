import { Controller, Get, Post, Body, Req, UseGuards, Param } from '@nestjs/common';
import { AdsService } from './ads.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Assuming standard NestJS auth
import { PrismaService } from '../prisma/prisma.service';

@Controller('ads')
export class AdsController {
  constructor(
    private readonly adsService: AdsService,
    private readonly prisma: PrismaService
  ) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get('decide')
  async decideAd(@Req() req) {
    const userContext = {
      userId: req.user?.id,
      device: req.headers['user-agent'],
    };
    return this.adsService.decideAd(userContext);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post('track/impression')
  async trackImpression(
    @Req() req,
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

  @UseGuards(OptionalJwtAuthGuard)
  @Post('track/click')
  async trackClick(
    @Req() req,
    @Body() body: { campaignId: string }
  ) {
    return this.adsService.trackClick({
      campaignId: body.campaignId,
      userId: req.user?.id,
      ip: req.ip
    });
  }

  // --- PHASE 2: ADVERTISER PORTAL ENDPOINTS ---

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyAdvertiserProfile(@Req() req) {
    const advertiser = await this.adsService.getOrCreateAdvertiser(req.user.id, req.user.email, req.user.name);
    const campaigns = await this.prisma.campaign.findMany({ 
      where: { advertiserId: advertiser.id },
      include: { creatives: true }
    });
    return { ...advertiser, campaigns };
  }

  @UseGuards(JwtAuthGuard)
  @Post('wallet/fund')
  async fundWallet(
    @Req() req,
    @Body() body: { amount: number, reference: string }
  ) {
    const advertiser = await this.adsService.getOrCreateAdvertiser(req.user.id, req.user.email, req.user.name);
    return this.adsService.requestManualFunding(advertiser.id, body.amount, body.reference);
  }

  @UseGuards(JwtAuthGuard)
  @Post('campaigns')
  async createCampaign(
    @Req() req,
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

  @Get('campaigns/pending')
  async getPendingCampaigns() {
    return this.prisma.campaign.findMany({
      where: { status: 'PENDING' },
      include: { advertiser: true, creatives: true }
    });
  }

  @Post('campaigns/approve/:id')
  async approveCampaign(@Param('id') id: string) {
    return this.adsService.approveCampaign(id);
  }
}
