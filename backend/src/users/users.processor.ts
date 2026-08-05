import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EmailService } from '../email/email.service';

@Processor('user-tasks')
export class UserProcessor extends WorkerHost {
  private readonly logger = new Logger(UserProcessor.name);

  constructor(private emailService: EmailService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.debug(`Processing job ${job.id} of type ${job.name} with data:`, job.data);

    switch (job.name) {
      case 'send-welcome-email': {
        const { email, username } = job.data;
        this.logger.log(`[Email Service] Sending welcome email to ${username} at ${email}`);
        await this.emailService.sendWelcomeEmail(email, username);
        this.logger.log(`[Email Service] Welcome email processing complete for ${email}`);
        break;
      }
      
      case 'process-profile-image': {
        this.logger.log(`[Image Service] Processing profile image for user ${job.data.userId}`);
        break;
      }

      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }

    return { status: 'completed' };
  }
}
