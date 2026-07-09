"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findOne(email) {
        return this.prisma.user.findUnique({ where: { email } });
    }
    async findByUsername(username) {
        return this.prisma.user.findUnique({ where: { username } });
    }
    async findByEmailOrUsername(identifier) {
        return this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { username: identifier }
                ]
            }
        });
    }
    async createUser(data) {
        return this.prisma.user.create({
            data,
        });
    }
    async getProfileByUsername(username, currentUserId) {
        const user = await this.prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                avatarUrl: true,
                coverUrl: true,
                occupation: true,
                bio: true,
                interests: true,
                country: true,
                state: true,
                createdAt: true,
                ...(currentUserId && {
                    followers: {
                        where: { followerId: currentUserId }
                    },
                    following: {
                        where: { followingId: currentUserId }
                    }
                }),
                _count: {
                    select: {
                        posts: true,
                        followers: true,
                        following: true,
                    }
                }
            }
        });
        if (!user)
            return null;
        const { followers, following, _count, ...rest } = user;
        return {
            ...rest,
            name: `${user.firstName} ${user.lastName}`,
            followers: _count?.followers || 0,
            followingCount: _count?.following || 0,
            postsCount: _count?.posts || 0,
            isFollowing: followers && followers.length > 0,
            isFollower: following && following.length > 0
        };
    }
    async updateProfile(userId, data) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        const updateData = { ...data };
        if (data.username && data.username !== user.username) {
            const existingUser = await this.prisma.user.findUnique({ where: { username: data.username } });
            if (existingUser) {
                throw new common_1.BadRequestException('Username is not available');
            }
            if (user.lastUsernameChange) {
                const daysSinceChange = (new Date().getTime() - new Date(user.lastUsernameChange).getTime()) / (1000 * 3600 * 24);
                if (daysSinceChange < 45) {
                    throw new common_1.BadRequestException('You can only change your username once every 45 days');
                }
            }
            updateData.username = data.username;
            updateData.lastUsernameChange = new Date();
        }
        return this.prisma.user.update({
            where: { id: userId },
            data: updateData,
        });
    }
    async followUser(followerId, followingUsername) {
        const followingUser = await this.findByUsername(followingUsername);
        if (!followingUser)
            throw new common_1.BadRequestException('User not found');
        if (followerId === followingUser.id)
            throw new common_1.BadRequestException('You cannot follow yourself');
        const existingFollow = await this.prisma.follows.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId: followingUser.id,
                }
            }
        });
        if (existingFollow)
            throw new common_1.BadRequestException('You are already following this user');
        const follow = await this.prisma.follows.create({
            data: {
                followerId,
                followingId: followingUser.id,
            }
        });
        await this.prisma.notification.create({
            data: {
                recipientId: followingUser.id,
                actorId: followerId,
                type: 'FOLLOW',
            }
        });
        return follow;
    }
    async unfollowUser(followerId, followingUsername) {
        const followingUser = await this.findByUsername(followingUsername);
        if (!followingUser)
            throw new common_1.BadRequestException('User not found');
        return this.prisma.follows.delete({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId: followingUser.id,
                }
            }
        }).catch(() => {
            throw new common_1.BadRequestException('You are not following this user');
        });
    }
    async getFollowers(username) {
        const user = await this.findByUsername(username);
        if (!user)
            throw new common_1.BadRequestException('User not found');
        const follows = await this.prisma.follows.findMany({
            where: { followingId: user.id },
            include: {
                follower: {
                    select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true, bio: true }
                }
            }
        });
        return follows.map(f => ({ ...f.follower, name: `${f.follower.firstName} ${f.follower.lastName}` }));
    }
    async getFollowing(username) {
        const user = await this.findByUsername(username);
        if (!user)
            throw new common_1.BadRequestException('User not found');
        const follows = await this.prisma.follows.findMany({
            where: { followerId: user.id },
            include: {
                following: {
                    select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true, bio: true }
                }
            }
        });
        return follows.map(f => ({ ...f.following, name: `${f.following.firstName} ${f.following.lastName}` }));
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map