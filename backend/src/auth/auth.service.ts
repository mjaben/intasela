import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectQueue('user-tasks') private userQueue: Queue
  ) {}

  async validateUser(identifier: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmailOrUsername(identifier);
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user
    };
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

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newUser = await this.usersService.createUser({
      ...data,
      password: hashedPassword,
    });

    const { password, ...result } = newUser;

    // Dispatch background job (fire-and-forget to avoid blocking if Redis is down)
    this.userQueue.add('send-welcome-email', {
      email: result.email,
      username: result.username,
    }).catch(err => {
      console.warn('Failed to enqueue welcome email (Redis might be down):', err.message);
    });

    return this.login(result);
  }
}
