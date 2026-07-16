import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AdsController, AdminAdsController } from './ads.controller';
import { AdsService } from './ads.service';
import { TrackingProcessor } from './tracking.processor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'ad-tracking',
    }),
  ],
  controllers: [AdsController, AdminAdsController],
  providers: [AdsService, TrackingProcessor],
})
export class AdsModule {}
