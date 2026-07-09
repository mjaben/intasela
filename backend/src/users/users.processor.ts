import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('user-tasks')
export class UserProcessor extends WorkerHost {
  private readonly logger = new Logger(UserProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.debug(`Processing job ${job.id} of type ${job.name} with data:`, job.data);

    switch (job.name) {
      case 'send-welcome-email': {
        const { email, username } = job.data;
        // Simulate sending email
        this.logger.log(`[Email Service] Simulating welcome email sent to ${username} at ${email}`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        this.logger.log(`[Email Service] Welcome email processing complete for ${email}`);
        break;
      }
      
      case 'process-profile-image': {
        // Placeholder for future image processing logic
        this.logger.log(`[Image Service] Processing profile image for user ${job.data.userId}`);
        break;
      }

      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }

    return { status: 'completed' };
  }
}
