import { Controller, Get, Param, NotFoundException, Patch, Body, Request, UseGuards, Post, Delete, Headers, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService, private jwtService: JwtService) {}

  @Get('profile/:username')
  async getProfile(@Param('username') username: string, @Headers('authorization') authHeader?: string) {
    let currentUserId: string | undefined;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = this.jwtService.verify(token);
        currentUserId = decoded.sub;
      } catch (e) {}
    }

    const profile = await this.usersService.getProfileByUsername(username, currentUserId);
    if (!profile) {
      throw new NotFoundException('User not found');
    }
    return profile;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/settings')
  async getSettings(@Request() req: any) {
    return this.usersService.getSettings(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/settings')
  async updateSettings(@Request() req: any, @Body() data: any) {
    return this.usersService.updateSettings(req.user.id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/email/request-update')
  async requestEmailUpdate(@Request() req: any, @Body() data: { newEmail: string }) {
    return this.usersService.requestEmailUpdate(req.user.id, data.newEmail);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/email/verify')
  async verifyEmailUpdate(@Request() req: any, @Body() data: { otp: string }) {
    return this.usersService.verifyEmailUpdate(req.user.id, data.otp);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/creator-studio')
  async getCreatorStudio(@Request() req: any, @Query('period') period?: string) {
    return this.usersService.getCreatorStudioData(req.user.id, period);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Request() req: any,
    @Body() updateData: { firstName?: string; lastName?: string; phone?: string; bio?: string; country?: string; state?: string; username?: string; avatarUrl?: string; coverUrl?: string }
  ) {
    const userId = req.user.id;
    return this.usersService.updateProfile(userId, updateData);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':username/follow')
  async followUser(@Request() req: any, @Param('username') username: string) {
    const followerId = req.user.id;
    return this.usersService.followUser(followerId, username);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':username/follow')
  async unfollowUser(@Request() req: any, @Param('username') username: string) {
    const followerId = req.user.id;
    return this.usersService.unfollowUser(followerId, username);
  }

  @Get(':username/followers')
  async getFollowers(@Param('username') username: string) {
    return this.usersService.getFollowers(username);
  }

  @Get(':username/following')
  async getFollowing(@Param('username') username: string) {
    return this.usersService.getFollowing(username);
  }
}
