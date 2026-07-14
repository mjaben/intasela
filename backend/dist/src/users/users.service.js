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
    async getSettings(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                username: true,
                avatarUrl: true,
                settings: true
            }
        });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        return user;
    }
    async updateSettings(userId, data) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                settings: data
            }
        });
    }
    async requestEmailUpdate(userId, newEmail) {
        const existingUser = await this.prisma.user.findUnique({ where: { email: newEmail } });
        if (existingUser) {
            throw new common_1.BadRequestException('Email is already in use');
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`[EMAIL VERIFICATION] OTP for ${newEmail} is: ${otp}`);
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                pendingEmail: newEmail,
                emailVerificationOtp: otp,
            }
        });
        return { message: 'OTP generated and sent' };
    }
    async verifyEmailUpdate(userId, otp) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        if (!user.pendingEmail || user.emailVerificationOtp !== otp) {
            throw new common_1.BadRequestException('Invalid OTP or no pending email request');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                email: user.pendingEmail,
                pendingEmail: null,
                emailVerificationOtp: null
            }
        });
        return { message: 'Email updated successfully', email: user.pendingEmail };
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
    async getCreatorStudioData(userId, period = 'all') {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { walletBalance: true, paymentSettings: true }
        });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        let dateFilter = undefined;
        const now = new Date();
        if (period === 'today') {
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            dateFilter = { gte: startOfDay };
        }
        else if (period === 'yesterday') {
            const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            dateFilter = { gte: startOfYesterday, lt: endOfYesterday };
        }
        else if (period === '7days') {
            const last7Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            dateFilter = { gte: last7Days };
        }
        else if (period === 'month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter = { gte: startOfMonth };
        }
        const whereClause = { userId };
        const postWhereClause = { authorId: userId };
        if (dateFilter) {
            whereClause.createdAt = dateFilter;
            postWhereClause.createdAt = dateFilter;
        }
        const prismaAny = this.prisma;
        let transactions = [];
        try {
            transactions = await prismaAny.transaction.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                include: {
                    post: {
                        select: { id: true, content: true }
                    }
                }
            });
        }
        catch (e) {
            console.warn("Transactions table might not be accessible yet", e.message);
        }
        const allUserPosts = await this.prisma.post.findMany({
            where: postWhereClause,
            select: { parentId: true, isEligible: true, isFlagged: true, viewsCount: true, createdAt: true }
        });
        const metrics = {
            totalPosts: 0,
            eligiblePosts: 0,
            totalComments: 0,
            eligibleComments: 0,
            totalViews: 0,
            eligibleViews: 0
        };
        const chartMap = new Map();
        for (const post of allUserPosts) {
            const isComment = post.parentId !== null;
            const isEligible = post.isEligible && !post.isFlagged;
            if (isComment) {
                metrics.totalComments++;
                if (isEligible)
                    metrics.eligibleComments++;
            }
            else {
                metrics.totalPosts++;
                if (isEligible)
                    metrics.eligiblePosts++;
            }
            metrics.totalViews += post.viewsCount;
            if (isEligible)
                metrics.eligibleViews += post.viewsCount;
            const dateStr = new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            const current = chartMap.get(dateStr) || { views: 0, engagements: 0 };
            current.views += post.viewsCount;
            chartMap.set(dateStr, current);
        }
        const allEngagements = await this.prisma.engagement.findMany({
            where: { post: { authorId: userId }, ...(dateFilter ? { createdAt: dateFilter } : {}) }
        });
        for (const eng of allEngagements) {
            const dateStr = new Date(eng.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            const current = chartMap.get(dateStr) || { views: 0, engagements: 0 };
            current.engagements += 1;
            chartMap.set(dateStr, current);
        }
        const chartData = Array.from(chartMap.entries())
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const periodEarned = transactions.reduce((acc, t) => acc + (t.amount || 0), 0);
        return {
            walletBalance: user.walletBalance,
            payoutThreshold: 50000,
            paymentSettings: user.paymentSettings,
            metrics,
            periodEarned,
            periodMonetizedPosts: transactions.length,
            history: transactions,
            chartData
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
    async deleteAllPosts(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        return this.prisma.post.deleteMany({
            where: { authorId: userId }
        });
    }
    async deleteAccount(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        return this.prisma.user.delete({
            where: { id: userId }
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map