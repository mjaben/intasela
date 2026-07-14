import { Module } from '@nestjs/common';
import { MonetizationService } from './monetization.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [MonetizationService],
  exports: [MonetizationService],
})
export class MonetizationModule {}
