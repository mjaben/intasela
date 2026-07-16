import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { AdsService } from './ads.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard'; // Assuming this exists, if not just skip guard for tracking

@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get('decide')
  async decideAd(@Req() req) {
    // Collect user context for the Decision Engine
    const userContext = {
      userId: req.user?.id,
      device: req.headers['user-agent'],
      // Add geolocation etc. in future
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
}
