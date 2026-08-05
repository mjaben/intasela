import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import {
  registrationOtpTemplate,
  welcomeEmailTemplate,
  forgotPasswordOtpTemplate,
  emailUpdateOtpTemplate,
  payoutNotificationTemplate,
} from './email.templates';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private defaultFrom: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.defaultFrom = process.env.EMAIL_FROM || 'Intasela <no-reply@intasela.com>';

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend Email Service initialized.');
    } else {
      this.logger.warn('RESEND_API_KEY is not set. Email sending will be logged to console in dev mode.');
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      if (!this.resend) {
        this.logger.log(`[Dev Email Mock] To: ${to} | Subject: ${subject}`);
        return true;
      }

      const response = await this.resend.emails.send({
        from: this.defaultFrom,
        to: [to],
        subject,
        html,
      });

      if (response.error) {
        this.logger.error(`Failed to send email to ${to} via Resend:`, response.error);
        return false;
      }

      this.logger.log(`Email successfully sent to ${to} (ID: ${response.data?.id})`);
      return true;
    } catch (error) {
      this.logger.error(`Unexpected error sending email to ${to}`, error);
      return false;
    }
  }

  async sendRegistrationOtp(email: string, otp: string): Promise<boolean> {
    const html = registrationOtpTemplate(otp);
    return this.sendEmail(email, `${otp} is your Intasela verification code`, html);
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const html = welcomeEmailTemplate(name);
    return this.sendEmail(email, `Welcome to Intasela, ${name}! 🎉`, html);
  }

  async sendForgotPasswordOtp(email: string, otp: string): Promise<boolean> {
    const html = forgotPasswordOtpTemplate(otp);
    return this.sendEmail(email, `${otp} is your password reset code`, html);
  }

  async sendEmailUpdateOtp(email: string, otp: string): Promise<boolean> {
    const html = emailUpdateOtpTemplate(otp);
    return this.sendEmail(email, `${otp} is your email update code`, html);
  }

  async sendPayoutNotification(email: string, amount: number, status: string): Promise<boolean> {
    const html = payoutNotificationTemplate(amount, status);
    return this.sendEmail(email, `Payout Update: ${status}`, html);
  }
}
