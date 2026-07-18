import { Injectable, NotFoundException, ForbiddenException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SpacesService {
  constructor(private prisma: PrismaService) {}

  async createSpace(adminId: string, data: { name: string; description?: string; coverUrl?: string; type?: string }) {
    if (adminId !== 'admin') {
      const admin = await this.prisma.systemAdmin.findUnique({ where: { id: adminId } });
      if (!admin) throw new ForbiddenException('Only System Admin can create spaces');
    }

    return this.prisma.space.create({
      data: {
        name: data.name,
        description: data.description,
        coverUrl: data.coverUrl,
        type: data.type || 'PUBLIC',
      },
    });
  }



  async getAllSpaces(userId?: string, adminId?: string) {
    let spaces: any[] = [];
    if (adminId) {
      if (adminId !== 'admin') {
        const admin = await this.prisma.systemAdmin.findUnique({ where: { id: adminId } });
        if (!admin) throw new ForbiddenException('Not authorized');
      }
      spaces = await this.prisma.space.findMany({
        include: { _count: { select: { members: true } } }
      });
    } else if (userId) {
      spaces = await this.prisma.space.findMany({
        where: {
          OR: [
            { type: 'PUBLIC' },
            { members: { some: { userId, status: 'ACTIVE' } } }
          ]
        },
        include: { 
          _count: { select: { members: { where: { status: 'ACTIVE' } } } },
          members: {
            where: { userId, status: 'ACTIVE' },
            select: { userId: true, status: true }
          }
        }
      });
    } else {
      spaces = await this.prisma.space.findMany({
        where: { type: 'PUBLIC' },
        include: { _count: { select: { members: { where: { status: 'ACTIVE' } } } } }
      });
    }

    // Attach sample members for AvatarGroup UI
    spaces = await Promise.all(spaces.map(async (space) => {
      const sampleMembers = await this.prisma.spaceMember.findMany({
        where: { spaceId: space.id, status: 'ACTIVE' },
        take: 3,
        include: { user: { select: { id: true, firstName: true, username: true, avatarUrl: true } } }
      });
      return { ...space, sampleMembers };
    }));

    return spaces;
  }

  async getSpaceById(id: string, userId?: string) {
    const space = await this.prisma.space.findUnique({
      where: { id },
      include: {
        members: {
          where: { userId },
          take: 1
        },
        _count: { select: { members: { where: { status: 'ACTIVE' } } } }
      }
    });

    if (!space) throw new NotFoundException('Space not found');

    if (space.type === 'PRIVATE' && (!userId || space.members.length === 0 || !['ACTIVE', 'INVITED'].includes(space.members[0].status))) {
      throw new ForbiddenException('You do not have access to this private space');
    }

    return space;
  }

  async requestToJoin(spaceId: string, userId: string) {
    const space = await this.prisma.space.findUnique({ where: { id: spaceId } });
    if (!space) throw new NotFoundException('Space not found');

    const existingMember = await this.prisma.spaceMember.findUnique({
      where: { spaceId_userId: { spaceId, userId } }
    });

    if (existingMember) {
      if (existingMember.status === 'ACTIVE') throw new BadRequestException('Already a member');
      if (existingMember.status === 'SUSPENDED' || existingMember.status === 'BANNED') {
        throw new ForbiddenException('You are suspended from this space.');
      }
      if (existingMember.status === 'INVITED' || existingMember.status === 'PENDING') {
        return this.prisma.spaceMember.update({
          where: { spaceId_userId: { spaceId, userId } },
          data: { status: 'ACTIVE' }
        });
      }
      return existingMember;
    }

    if (space.type === 'PRIVATE') throw new BadRequestException('Cannot request to join a private space without an invite');

    return this.prisma.spaceMember.create({
      data: { spaceId, userId, status: 'ACTIVE' }
    });
  }

  async leaveSpace(spaceId: string, userId: string) {
    const existingMember = await this.prisma.spaceMember.findUnique({
      where: { spaceId_userId: { spaceId, userId } }
    });

    if (!existingMember) throw new BadRequestException('Not a member');

    return this.prisma.spaceMember.delete({
      where: { spaceId_userId: { spaceId, userId } }
    });
  }

  async inviteUser(adminOrModId: string, spaceId: string, targetUsername: string) {
    const space = await this.prisma.space.findUnique({ where: { id: spaceId } });
    if (!space) throw new NotFoundException('Space not found');

    // Super Admin check (simulate admin id usage here)
    let isAdmin = adminOrModId === 'admin';
    if (!isAdmin) {
      const admin = await this.prisma.systemAdmin.findUnique({ where: { id: adminOrModId } });
      if (admin) isAdmin = true;
    }
    
    let isMod = false;
    
    if (!isAdmin) {
      // Check if moderator
      const member = await this.prisma.spaceMember.findUnique({
        where: { spaceId_userId: { spaceId, userId: adminOrModId } }
      });
      if (member && member.role === 'MODERATOR' && member.status === 'ACTIVE') {
        isMod = true;
      }
    }

    if (!isAdmin && !isMod) throw new ForbiddenException('Not authorized to invite');

    const targetUser = await this.prisma.user.findUnique({ where: { username: targetUsername } });
    if (!targetUser) throw new NotFoundException('User not found');

    const existing = await this.prisma.spaceMember.findUnique({
      where: { spaceId_userId: { spaceId, userId: targetUser.id } }
    });

    if (existing) throw new BadRequestException('User is already invited or a member');

    const membership = await this.prisma.spaceMember.create({
      data: { spaceId, userId: targetUser.id, status: 'INVITED' }
    });

    // Create Notification
    let validActorId = adminOrModId;
    let isAdminUser = false;
    if (adminOrModId === 'admin') {
      isAdminUser = true;
    } else {
      const admin = await this.prisma.systemAdmin.findUnique({ where: { id: adminOrModId } });
      if (admin) isAdminUser = true;
    }

    if (isAdminUser) validActorId = targetUser.id;

    await this.prisma.notification.create({
      data: {
        recipientId: targetUser.id,
        actorId: validActorId, 
        type: 'SPACE_INVITE',
        spaceId: spaceId
      }
    }).catch(e => {
        console.error("Notification creation failed:", e);
    });

    return membership;
  }

  async revokeInvitation(adminOrModId: string, spaceId: string, targetUserId: string) {
    const space = await this.prisma.space.findUnique({ where: { id: spaceId } });
    if (!space) throw new NotFoundException('Space not found');

    let isAdmin = adminOrModId === 'admin';
    if (!isAdmin) {
      const admin = await this.prisma.systemAdmin.findUnique({ where: { id: adminOrModId } });
      if (admin) isAdmin = true;
    }
    
    let isMod = false;
    if (!isAdmin) {
      const member = await this.prisma.spaceMember.findUnique({
        where: { spaceId_userId: { spaceId, userId: adminOrModId } }
      });
      if (member && member.role === 'MODERATOR' && member.status === 'ACTIVE') {
        isMod = true;
      }
    }

    if (!isAdmin && !isMod) throw new ForbiddenException('Not authorized to revoke invites');

    const existing = await this.prisma.spaceMember.findUnique({
      where: { spaceId_userId: { spaceId, userId: targetUserId } }
    });

    if (!existing || existing.status !== 'INVITED') {
      throw new BadRequestException('User is not currently invited');
    }

    return this.prisma.spaceMember.delete({
      where: { spaceId_userId: { spaceId, userId: targetUserId } }
    });
  }

  async appealSuspension(spaceId: string, userId: string) {
    const membership = await this.prisma.spaceMember.findUnique({
      where: { spaceId_userId: { spaceId, userId } },
      include: { space: true }
    });

    if (!membership || membership.status !== 'SUSPENDED') {
      throw new BadRequestException('You cannot appeal because you are not suspended');
    }

    await this.prisma.spaceMember.update({
      where: { id: membership.id },
      data: { status: 'APPEALED' }
    });

    const moderators = await this.prisma.spaceMember.findMany({
      where: { spaceId, role: 'MODERATOR', status: 'ACTIVE' }
    });

    const notifs = moderators.map(mod => ({
      recipientId: mod.userId,
      actorId: userId,
      type: 'SPACE_APPEAL',
      spaceId: spaceId
    }));

    if (notifs.length > 0) {
      await this.prisma.notification.createMany({ data: notifs });
    }

    return { message: 'Appeal submitted successfully' };
  }

  async acceptInvitation(spaceId: string, userId: string) {
    const membership = await this.prisma.spaceMember.findUnique({
      where: { spaceId_userId: { spaceId, userId } }
    });

    if (!membership || membership.status !== 'INVITED') {
      throw new BadRequestException('No pending invitation found');
    }

    return this.prisma.spaceMember.update({
      where: { id: membership.id },
      data: { status: 'ACTIVE' }
    });
  }

  async updateMemberRole(adminId: string, spaceId: string, targetUserId: string, role: string, permissions?: string[]) {
    if (adminId !== 'admin') {
      const admin = await this.prisma.systemAdmin.findUnique({ where: { id: adminId } });
      if (!admin) throw new ForbiddenException('Only System Admin can assign roles');
    }

    const membership = await this.prisma.spaceMember.findUnique({
      where: { spaceId_userId: { spaceId, userId: targetUserId } }
    });

    if (!membership) throw new NotFoundException('Member not found in space');

    const updated = await this.prisma.spaceMember.update({
      where: { id: membership.id },
      data: { 
        role,
        permissions: role === 'MODERATOR' ? (permissions || []) : Prisma.DbNull
      }
    });

    let validActorId = adminId;
    let isAdminRoleUpdate = false;
    if (adminId === 'admin') {
      isAdminRoleUpdate = true;
    } else {
      const admin = await this.prisma.systemAdmin.findUnique({ where: { id: adminId } });
      if (admin) isAdminRoleUpdate = true;
    }

    if (isAdminRoleUpdate) validActorId = targetUserId;

    // Notification
    await this.prisma.notification.create({
      data: {
        recipientId: targetUserId,
        actorId: validActorId,
        type: 'SPACE_ROLE_UPDATE',
        spaceId: spaceId
      }
    }).catch(e => console.error("Notification failed", e));

    return updated;
  }

  async updateMemberStatus(adminOrModId: string, spaceId: string, targetUserId: string, status?: string, reason?: string) {
    let isAdmin = adminOrModId === 'admin';
    if (!isAdmin) {
      const admin = await this.prisma.systemAdmin.findUnique({ where: { id: adminOrModId } });
      if (admin) isAdmin = true;
    }
    
    if (!isAdmin) {
        const mod = await this.prisma.spaceMember.findUnique({
            where: { spaceId_userId: { spaceId, userId: adminOrModId } }
        });
        if (!mod || mod.role !== 'MODERATOR' || mod.status !== 'ACTIVE') {
            throw new ForbiddenException('Only Admin or Moderator can update user status');
        }
    }

    const membership = await this.prisma.spaceMember.findUnique({
      where: { spaceId_userId: { spaceId, userId: targetUserId } }
    });

    if (!membership) throw new NotFoundException('Member not found');

    const newStatus = status || 'SUSPENDED';

    return this.prisma.spaceMember.update({
      where: { id: membership.id },
      data: { 
        status: newStatus,
        suspendReason: newStatus === 'SUSPENDED' ? reason : null 
      }
    });
  }

  async getAppeals(adminId: string) {
    if (adminId !== 'admin') {
      const admin = await this.prisma.systemAdmin.findUnique({ where: { id: adminId } });
      if (!admin) throw new ForbiddenException('Only System Admin can view appeals queue');
    }

    return this.prisma.spaceMember.findMany({
      where: { status: 'APPEALED' },
      include: {
        user: { select: { id: true, username: true, firstName: true, avatarUrl: true } },
        space: { select: { id: true, name: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async getSpaceMembers(spaceId: string, userId?: string, adminId?: string) {
    const space = await this.prisma.space.findUnique({ where: { id: spaceId } });
    if (!space) throw new NotFoundException('Space not found');

    let isAdmin = false;
    if (adminId) {
      if (adminId === 'admin') isAdmin = true;
      else {
        const admin = await this.prisma.systemAdmin.findUnique({ where: { id: adminId } });
        if (admin) isAdmin = true;
      }
    }

    if (space.type === 'PRIVATE' && !isAdmin) {
      if (!userId) throw new ForbiddenException('Not authorized');
      const member = await this.prisma.spaceMember.findUnique({
        where: { spaceId_userId: { spaceId, userId } }
      });
      if (!member || member.status !== 'ACTIVE') throw new ForbiddenException('Not authorized');
    }

    return this.prisma.spaceMember.findMany({
      where: { spaceId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateSpace(adminId: string, spaceId: string, data: { name?: string; description?: string; coverUrl?: string; type?: string }) {
    if (adminId !== 'admin') {
      const admin = await this.prisma.systemAdmin.findUnique({ where: { id: adminId } });
      if (!admin) throw new ForbiddenException('Only System Admin can update spaces');
    }

    const space = await this.prisma.space.findUnique({ where: { id: spaceId } });
    if (!space) throw new NotFoundException('Space not found');

    return this.prisma.space.update({
      where: { id: spaceId },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        description: data.description !== undefined ? data.description : undefined,
        coverUrl: data.coverUrl !== undefined ? data.coverUrl : undefined,
        type: data.type !== undefined ? data.type : undefined,
      }
    });
  }

  async deleteSpace(adminId: string, spaceId: string) {
    if (adminId !== 'admin') {
      const admin = await this.prisma.systemAdmin.findUnique({ where: { id: adminId } });
      if (!admin) throw new ForbiddenException('Only System Admin can delete spaces');
    }

    const space = await this.prisma.space.findUnique({ where: { id: spaceId } });
    if (!space) throw new NotFoundException('Space not found');

    // Due to relations, we might need to delete members first, or rely on cascade
    // Our schema for SpaceMember does not have onDelete: Cascade right now (maybe it does, let's assume it doesn't and clean it up).
    await this.prisma.spaceMember.deleteMany({ where: { spaceId } });

    // What about posts? Posts have spaceId. If no cascade, we should set spaceId to null or delete them.
    // Setting spaceId to null is safer.
    await this.prisma.post.updateMany({
      where: { spaceId },
      data: { spaceId: null }
    });

    return this.prisma.space.delete({
      where: { id: spaceId }
    });
  }
}
