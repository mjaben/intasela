import { Injectable, NotFoundException, ForbiddenException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Helper to check if a given ID belongs to a SystemAdmin.
 * Replaces the old `adminId === 'admin'` string backdoor.
 */
async function isSystemAdmin(prisma: PrismaService, id: string | undefined): Promise<boolean> {
  if (!id) return false;
  const admin = await prisma.systemAdmin.findUnique({ where: { id } });
  return !!admin;
}

@Injectable()
export class SpacesService {
  constructor(private prisma: PrismaService) {}

  async createSpace(adminId: string, data: { name: string; description?: string; coverUrl?: string; type?: string; postApprovalMode?: string }) {
    if (!(await isSystemAdmin(this.prisma, adminId))) {
      throw new ForbiddenException('Only System Admin can create spaces');
    }

    return this.prisma.space.create({
      data: {
        name: data.name,
        description: data.description,
        coverUrl: data.coverUrl,
        type: data.type || 'PUBLIC',
        postApprovalMode: data.postApprovalMode || 'NONE',
      },
    });
  }



  async getAllSpaces(userId?: string, adminId?: string) {
    let spaces: any[] = [];
    if (adminId) {
      if (!(await isSystemAdmin(this.prisma, adminId))) {
        throw new ForbiddenException('Not authorized');
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
        members: userId ? {
          where: { userId },
          take: 1
        } : false,
        _count: { select: { members: { where: { status: 'ACTIVE' } } } }
      }
    });

    if (!space) throw new NotFoundException('Space not found');

    if (space.type === 'PRIVATE' && (!userId || space.members.length === 0 || !['ACTIVE', 'INVITED'].includes(space.members[0].status))) {
      throw new ForbiddenException('You do not have access to this private space');
    }

    return space;
  }

  async getPendingPosts(spaceId: string, currentUserId: string) {
    const adminCheck = await isSystemAdmin(this.prisma, currentUserId);

    if (!adminCheck) {
      const member = await this.prisma.spaceMember.findUnique({
        where: { spaceId_userId: { spaceId, userId: currentUserId } }
      });
      if (!member || (member.role !== 'MODERATOR' && member.role !== 'ADMIN')) {
        throw new ForbiddenException('Not authorized to view pending posts');
      }
    }

    return this.prisma.post.findMany({
      where: {
        spaceId,
        approvalStatus: 'PENDING'
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
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

    // Prevent the last moderator from leaving the space
    if (existingMember.role === 'MODERATOR' || existingMember.role === 'ADMIN') {
      const activeMods = await this.prisma.spaceMember.count({
        where: { 
          spaceId, 
          role: { in: ['MODERATOR', 'ADMIN'] },
          status: 'ACTIVE'
        }
      });
      if (activeMods <= 1) {
        throw new BadRequestException('You are the last active moderator. Please assign another moderator before leaving the space.');
      }
    }

    return this.prisma.spaceMember.delete({
      where: { spaceId_userId: { spaceId, userId } }
    });
  }

  async inviteUser(adminOrModId: string, spaceId: string, targetUsername: string) {
    const space = await this.prisma.space.findUnique({ where: { id: spaceId } });
    if (!space) throw new NotFoundException('Space not found');

    const isAdmin = await isSystemAdmin(this.prisma, adminOrModId);
    
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

    // Create Notification — use the admin/mod's actual ID as actor
    // For SystemAdmins, their ID is in the SystemAdmin table, not the User table,
    // so we use the target user as both actor and recipient for the notification.
    const validActorId = isAdmin ? targetUser.id : adminOrModId;

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

    const isAdmin = await isSystemAdmin(this.prisma, adminOrModId);
    
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
    if (!(await isSystemAdmin(this.prisma, adminId))) {
      throw new ForbiddenException('Only System Admin can assign roles');
    }

    const membership = await this.prisma.spaceMember.findUnique({
      where: { spaceId_userId: { spaceId, userId: targetUserId } }
    });

    if (!membership) throw new NotFoundException('Member not found in space');

    const updated = await this.prisma.spaceMember.update({
      where: { id: membership.id },
      data: { 
        role,
        status: role === 'MODERATOR' ? 'ACTIVE' : undefined, // Ensure mods are active
        permissions: role === 'MODERATOR' ? (permissions || []) : Prisma.DbNull
      }
    });

    // For SystemAdmins, their ID is not in the User table,
    // so use targetUserId as actor for the notification.
    const validActorId = targetUserId;

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
    const isAdmin = await isSystemAdmin(this.prisma, adminOrModId);
    
    if (!isAdmin) {
        const mod = await this.prisma.spaceMember.findUnique({
            where: { spaceId_userId: { spaceId, userId: adminOrModId } }
        });
        if (!mod || mod.role !== 'MODERATOR' || mod.status !== 'ACTIVE') {
            throw new ForbiddenException('Only Admin or Moderator can update user status');
        }
    }

    if (adminOrModId === targetUserId && !isAdmin) {
        throw new ForbiddenException('You cannot modify your own status');
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
    if (!(await isSystemAdmin(this.prisma, adminId))) {
      throw new ForbiddenException('Only System Admin can view appeals queue');
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

    const isAdmin = adminId ? await isSystemAdmin(this.prisma, adminId) : false;

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

  async updateSpace(adminId: string, spaceId: string, data: { name?: string; description?: string; coverUrl?: string; type?: string; postApprovalMode?: string }) {
    const isAdmin = await isSystemAdmin(this.prisma, adminId);

    if (!isAdmin) {
      const mod = await this.prisma.spaceMember.findUnique({
        where: { spaceId_userId: { spaceId, userId: adminId } }
      });
      if (!mod || mod.role !== 'MODERATOR' || !mod.permissions || !(mod.permissions as string[]).includes('EDIT_SPACE')) {
        throw new ForbiddenException('You do not have permission to edit this space');
      }
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
        postApprovalMode: data.postApprovalMode !== undefined ? data.postApprovalMode : undefined,
      }
    });
  }

  async deleteSpace(adminId: string, spaceId: string) {
    if (!(await isSystemAdmin(this.prisma, adminId))) {
      throw new ForbiddenException('Only System Admin can delete spaces');
    }

    const space = await this.prisma.space.findUnique({ where: { id: spaceId } });
    if (!space) throw new NotFoundException('Space not found');

    // Due to relations, we need to delete members first
    await this.prisma.spaceMember.deleteMany({ where: { spaceId } });

    // Setting spaceId to null is safer than deleting posts
    await this.prisma.post.updateMany({
      where: { spaceId },
      data: { spaceId: null }
    });

    return this.prisma.space.delete({
      where: { id: spaceId }
    });
  }
}
