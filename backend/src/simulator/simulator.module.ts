import { Module } from '@nestjs/common';
import { SimulatorService } from './simulator.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MonetizationModule } from '../monetization/monetization.module';

@Module({
  imports: [PrismaModule, MonetizationModule],
  providers: [SimulatorService],
  exports: [SimulatorService]
})
export class SimulatorModule {}
