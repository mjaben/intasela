import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Processor('ad-tracking')
export class TrackingProcessor extends WorkerHost {
  private readonly logger = new Logger(TrackingProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { name, data } = job;

    try {
      if (name === 'impression') {
        // 1. Log the impression
        await this.prisma.adImpression.create({
          data: {
            campaignId: data.campaignId,
            userId: data.userId,
            device: data.device,
            country: data.country,
            cost: data.cost
          }
        });

        // 2. Decrement Campaign Budget
        const campaign = await this.prisma.campaign.update({
          where: { id: data.campaignId },
          data: {
            remainingBudget: {
              decrement: data.cost
            }
          }
        });

        // 3. Pause campaign if out of budget
        if (campaign.remainingBudget <= 0 && campaign.status === 'ACTIVE') {
          await this.prisma.campaign.update({
            where: { id: campaign.id },
            data: { status: 'PAUSED' }
          });
          this.logger.log(`Campaign ${campaign.id} paused due to empty budget.`);
        }
      } 
      else if (name === 'click') {
        await this.prisma.adClick.create({
          data: {
            campaignId: data.campaignId,
            userId: data.userId,
            ip: data.ip
          }
        });
      }
    } catch (error) {
      this.logger.error(`Error processing ad tracking job ${job.id}`, error);
      throw error;
    }
  }
}
