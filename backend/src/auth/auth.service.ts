import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private registrationOtps = new Map<string, { otp: string; expiresAt: number }>();

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private prisma: PrismaService,
  ) {}

  async validateUser(identifier: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmailOrUsername(identifier);
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async checkAvailability(email?: string, username?: string, phone?: string) {
    const errors: string[] = [];

    if (email) {
      const userByEmail = await this.prisma.user.findUnique({ where: { email } });
      if (userByEmail) errors.push('Email is already in use');
    }

    if (username) {
      const userByUsername = await this.prisma.user.findUnique({ where: { username } });
      if (userByUsername) errors.push('Username is already taken');
    }

    if (phone) {
      const userByPhone = await this.prisma.user.findFirst({ where: { phone } });
      if (userByPhone) errors.push('Phone number is already in use');
    }

    if (errors.length > 0) {
      throw new ConflictException(errors);
    }

    return { available: true };
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user
    };
  }

  async sendRegistrationOtp(email: string) {
    const existing = await this.usersService.findOne(email);
    if (existing) {
      throw new ConflictException('Email is already in use');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000;
    this.registrationOtps.set(email.toLowerCase(), { otp, expiresAt });

    await this.emailService.sendRegistrationOtp(email, otp);
    return { message: 'Registration OTP sent successfully' };
  }

  async verifyRegistrationOtp(email: string, otp: string): Promise<boolean> {
    const record = this.registrationOtps.get(email.toLowerCase());
    if (!record || record.expiresAt < Date.now() || record.otp !== otp) {
      return false;
    }
    return true;
  }

  async register(data: any) {
    const existingEmail = await this.usersService.findOne(data.email);
    if (existingEmail) {
      throw new ConflictException('Email already in use');
    }
    const existingUsername = await this.usersService.findByUsername(data.username);
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    if (data.otp) {
      const valid = await this.verifyRegistrationOtp(data.email, data.otp);
      if (!valid) {
        throw new BadRequestException('Invalid or expired registration OTP');
      }
      this.registrationOtps.delete(data.email.toLowerCase());
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const { otp, ...createData } = data;
    const newUser = await this.usersService.createUser({
      ...createData,
      password: hashedPassword,
    });

    const { password, ...result } = newUser;

    // Send Welcome Email
    const recipientName = `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim() || newUser.username;
    await this.emailService.sendWelcomeEmail(newUser.email, recipientName);

    return this.login(result);
  }

  async forgotPassword(identifier: string) {
    const user = await this.usersService.findByEmailOrUsername(identifier);
    if (!user) {
      return { message: 'If an account exists, a password reset code has been sent.' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationOtp: otp }
    });

    await this.emailService.sendForgotPasswordOtp(user.email, otp);
    return { message: 'If an account exists, a password reset code has been sent.' };
  }

  async resetPassword(data: { email: string; otp: string; newPassword: string }) {
    const user = await this.usersService.findByEmailOrUsername(data.email);
    if (!user || !user.emailVerificationOtp || user.emailVerificationOtp !== data.otp) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        emailVerificationOtp: null
      }
    });

    return { message: 'Password reset successfully' };
  }
}
