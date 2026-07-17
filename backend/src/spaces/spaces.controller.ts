import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, Headers, UnauthorizedException } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

@Controller('spaces')
export class SpacesController {
  constructor(
    private readonly spacesService: SpacesService,
    private readonly jwtService: JwtService
  ) {}

  @Post()
  async createSpace(@Headers('x-admin-id') adminId: string, @Body() body: any) {
    if (!adminId) throw new UnauthorizedException('Admin ID required');
    return this.spacesService.createSpace(adminId, body);
  }

  @Get()
  async getAllSpaces(@Headers('authorization') authHeader: string) {
    let currentUserId: string | undefined;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = this.jwtService.verify(token);
        currentUserId = decoded.sub;
      } catch (e) {}
    }
    return this.spacesService.getAllSpaces(currentUserId);
  }

  @Get(':id')
  async getSpaceById(@Param('id') id: string, @Headers('authorization') authHeader: string) {
    let currentUserId: string | undefined;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = this.jwtService.verify(token);
        currentUserId = decoded.sub;
      } catch (e) {}
    }
    return this.spacesService.getSpaceById(id, currentUserId);
  }

  @Get('admin/appeals')
  async getAppeals(@Headers('x-admin-id') adminId: string) {
    if (!adminId) throw new UnauthorizedException('Admin ID required');
    return this.spacesService.getAppeals(adminId);
  }

  @Get(':id/members')
  async getSpaceMembers(@Param('id') id: string, @Headers('authorization') authHeader: string) {
    let currentUserId: string | undefined;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = this.jwtService.verify(token);
        currentUserId = decoded.sub;
      } catch (e) {}
    }
    return this.spacesService.getSpaceMembers(id, currentUserId);
  }

  @Post(':id')
  async updateSpace(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('x-admin-id') adminId: string
  ) {
    if (!adminId) throw new UnauthorizedException('Admin ID required');
    return this.spacesService.updateSpace(adminId, id, body);
  }

  @Delete(':id')
  async deleteSpace(
    @Param('id') id: string,
    @Headers('x-admin-id') adminId: string
  ) {
    if (!adminId) throw new UnauthorizedException('Admin ID required');
    return this.spacesService.deleteSpace(adminId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/request-join')
  async requestToJoin(@Request() req: any, @Param('id') id: string) {
    return this.spacesService.requestToJoin(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/leave')
  async leaveSpace(@Request() req: any, @Param('id') id: string) {
    return this.spacesService.leaveSpace(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/appeal')
  async appealSuspension(@Request() req: any, @Param('id') id: string) {
    return this.spacesService.appealSuspension(id, req.user.id);
  }

  @Post(':id/invite')
  async inviteUser(
    @Param('id') id: string,
    @Body('username') username: string,
    @Headers('x-admin-id') adminId?: string,
    @Headers('authorization') authHeader?: string
  ) {
    let currentUserId: string | undefined = adminId;
    if (!currentUserId && authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = this.jwtService.verify(token);
        currentUserId = decoded.sub;
      } catch (e) {}
    }
    if (!currentUserId) throw new UnauthorizedException('Authentication required');
    return this.spacesService.inviteUser(currentUserId, id, username);
  }

  @Delete(':id/invitations/:userId')
  async revokeInvitation(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Headers('x-admin-id') adminId?: string,
    @Headers('authorization') authHeader?: string
  ) {
    let currentUserId: string | undefined = adminId;
    if (!currentUserId && authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = this.jwtService.verify(token);
        currentUserId = decoded.sub;
      } catch (e) {}
    }
    if (!currentUserId) throw new UnauthorizedException('Authentication required');
    return this.spacesService.revokeInvitation(currentUserId, id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/invitations/accept')
  async acceptInvitation(@Request() req: any, @Param('id') id: string) {
    return this.spacesService.acceptInvitation(id, req.user.id);
  }

  @Post(':id/members/:userId/role')
  async updateMemberRole(
    @Headers('x-admin-id') adminId: string,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body('role') role: string
  ) {
    if (!adminId) throw new UnauthorizedException('Admin ID required');
    return this.spacesService.updateMemberRole(adminId, id, userId, role);
  }

  @Patch(':id/members/:userId/suspend')
  async updateMemberStatus(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body('status') status: string,
    @Body('reason') reason: string,
    @Headers('x-admin-id') adminId?: string,
    @Headers('authorization') authHeader?: string
  ) {
    let currentUserId: string | undefined = adminId;
    if (!currentUserId && authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = this.jwtService.verify(token);
        currentUserId = decoded.sub;
      } catch (e) {}
    }
    if (!currentUserId) throw new UnauthorizedException('Authentication required');
    return this.spacesService.updateMemberStatus(currentUserId, id, userId, status, reason);
  }
}
