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
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const monetization_service_1 = require("../monetization/monetization.service");
let PostsService = class PostsService {
    prisma;
    monetizationService;
    constructor(prisma, monetizationService) {
        this.prisma = prisma;
        this.monetizationService = monetizationService;
    }
    getAuthorSelect(currentUserId) {
        return {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatarUrl: true,
            creatorType: true,
            ...(currentUserId && {
                followers: {
                    where: { followerId: currentUserId }
                },
                following: {
                    where: { followingId: currentUserId }
                }
            })
        };
    }
    async getFeed(currentUserId, type) {
        let whereClause = { parentId: null };
        if (type === 'following' && currentUserId) {
            whereClause = {
                ...whereClause,
                author: {
                    followers: {
                        some: {
                            followerId: currentUserId
                        }
                    }
                }
            };
        }
        const posts = await this.prisma.post.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: this.getAuthorSelect(currentUserId)
                },
                _count: {
                    select: { replies: true, engagements: true }
                },
                engagements: true,
                quotedPost: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                username: true,
                                avatarUrl: true,
                            }
                        }
                    }
                }
            },
            take: 20,
        });
        return posts.map(post => this.formatPost(post, currentUserId));
    }
    async getOrbitFeed(currentUserId, type) {
        let whereClause = { mediaType: 'VIDEO', parentId: null };
        if (type === 'following' && currentUserId) {
            whereClause.author = {
                followers: {
                    some: { followerId: currentUserId }
                }
            };
        }
        const posts = await this.prisma.post.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: this.getAuthorSelect(currentUserId)
                },
                _count: {
                    select: { replies: true, engagements: true }
                },
                engagements: true,
            },
            take: 20,
        });
        return posts.map(post => this.formatPost(post, currentUserId));
    }
    async getPostsByUsername(username, currentUserId) {
        const user = await this.prisma.user.findUnique({ where: { username } });
        if (!user)
            return [];
        const posts = await this.prisma.post.findMany({
            where: {
                OR: [
                    { author: { username }, parentId: null },
                    { engagements: { some: { type: 'RESELA', userId: user.id } } }
                ]
            },
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: this.getAuthorSelect(currentUserId)
                },
                _count: {
                    select: { replies: true, engagements: true }
                },
                engagements: true,
                quotedPost: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                username: true,
                                avatarUrl: true,
                            }
                        }
                    }
                }
            },
        });
        const formattedPosts = posts.map(post => {
            const formatted = this.formatPost(post, currentUserId);
            const isReselaByProfile = post.author.username !== username;
            if (isReselaByProfile) {
                formatted.reselaedBy = username;
            }
            return formatted;
        });
        formattedPosts.sort((a, b) => {
            const postA = posts.find(p => p.id === a.id);
            const postB = posts.find(p => p.id === b.id);
            const reselaA = postA?.engagements.find(e => e.type === 'RESELA' && e.userId === user.id);
            const dateA = reselaA ? new Date(reselaA.createdAt).getTime() : new Date(a.createdAt).getTime();
            const reselaB = postB?.engagements.find(e => e.type === 'RESELA' && e.userId === user.id);
            const dateB = reselaB ? new Date(reselaB.createdAt).getTime() : new Date(b.createdAt).getTime();
            return dateB - dateA;
        });
        return formattedPosts;
    }
    async getRepliesByUsername(username, currentUserId) {
        const posts = await this.prisma.post.findMany({
            where: {
                author: { username },
                parentId: { not: null }
            },
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: this.getAuthorSelect(currentUserId)
                },
                _count: { select: { replies: true, engagements: true } },
                engagements: true,
                quotedPost: { include: { author: { select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true } } } },
                parent: {
                    include: {
                        author: { select: this.getAuthorSelect(currentUserId) },
                        _count: { select: { replies: true, engagements: true } },
                        engagements: true,
                        quotedPost: { include: { author: { select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true } } } }
                    }
                }
            },
        });
        return posts.map(post => this.formatPost(post, currentUserId));
    }
    async getLikesByUsername(username, currentUserId) {
        const posts = await this.prisma.post.findMany({
            where: {
                engagements: {
                    some: {
                        user: { username },
                        type: 'LIKE'
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: this.getAuthorSelect(currentUserId)
                },
                _count: { select: { replies: true, engagements: true } },
                engagements: true,
                quotedPost: { include: { author: { select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true } } } }
            },
        });
        return posts.map(post => this.formatPost(post, currentUserId));
    }
    async getBookmarks(currentUserId) {
        const posts = await this.prisma.post.findMany({
            where: {
                engagements: {
                    some: {
                        userId: currentUserId,
                        type: 'BOOKMARK'
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: this.getAuthorSelect(currentUserId)
                },
                _count: { select: { replies: true, engagements: true } },
                engagements: true,
                quotedPost: { include: { author: { select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true } } } }
            },
        });
        return posts.map(post => this.formatPost(post, currentUserId));
    }
    formatPost(post, currentUserId) {
        if (!post)
            return null;
        const likes = post.engagements ? post.engagements.filter((e) => e.type === 'LIKE') : [];
        const reselas = post.engagements ? post.engagements.filter((e) => e.type === 'RESELA') : [];
        const bookmarks = post.engagements ? post.engagements.filter((e) => e.type === 'BOOKMARK') : [];
        const isLiked = currentUserId ? likes.some((e) => e.userId === currentUserId) : false;
        const isReselaed = currentUserId ? reselas.some((e) => e.userId === currentUserId) : false;
        const isBookmarked = currentUserId ? bookmarks.some((e) => e.userId === currentUserId) : false;
        const isFollowing = currentUserId && post.author?.followers && post.author.followers.length > 0;
        const isFollower = currentUserId && post.author?.following && post.author.following.length > 0;
        const { engagements, parent, author, ...rest } = post;
        return {
            ...rest,
            author: author ? { ...author, isFollowing, isFollower } : undefined,
            parent: parent ? this.formatPost(parent, currentUserId) : undefined,
            stats: {
                likes: likes.length,
                reselas: reselas.length,
                replies: post._count?.replies || 0,
                views: post.viewsCount || 0,
                bookmarks: bookmarks.length
            },
            userInteractions: {
                isLiked,
                isReselaed,
                isBookmarked
            }
        };
    }
    async getPostById(postId, currentUserId) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
            include: {
                author: {
                    select: this.getAuthorSelect(currentUserId)
                },
                _count: { select: { replies: true, engagements: true } },
                engagements: true,
                quotedPost: {
                    include: { author: { select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true } } }
                },
                replies: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        author: { select: this.getAuthorSelect(currentUserId) },
                        _count: { select: { replies: true, engagements: true } },
                        engagements: true,
                        quotedPost: {
                            include: { author: { select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true } } }
                        }
                    }
                },
                parent: {
                    include: {
                        author: { select: this.getAuthorSelect(currentUserId) },
                        _count: { select: { replies: true, engagements: true } },
                        engagements: true,
                        quotedPost: { include: { author: { select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true } } } }
                    }
                }
            }
        });
        if (!post)
            return null;
        const formatPost = (p) => {
            if (!p)
                return null;
            const likes = p.engagements ? p.engagements.filter((e) => e.type === 'LIKE') : [];
            const reselas = p.engagements ? p.engagements.filter((e) => e.type === 'RESELA') : [];
            const bookmarks = p.engagements ? p.engagements.filter((e) => e.type === 'BOOKMARK') : [];
            const isLiked = currentUserId ? likes.some((e) => e.userId === currentUserId) : false;
            const isReselaed = currentUserId ? reselas.some((e) => e.userId === currentUserId) : false;
            const isBookmarked = currentUserId ? bookmarks.some((e) => e.userId === currentUserId) : false;
            const isFollowing = currentUserId && p.author?.followers && p.author.followers.length > 0;
            const isFollower = currentUserId && p.author?.following && p.author.following.length > 0;
            const { engagements, parent, author, ...rest } = p;
            return {
                ...rest,
                author: author ? { ...author, isFollowing, isFollower } : undefined,
                parent: parent ? formatPost(parent) : undefined,
                stats: { likes: likes.length, reselas: reselas.length, replies: p._count?.replies || 0, views: p.viewsCount || 0 },
                userInteractions: { isLiked, isReselaed, isBookmarked }
            };
        };
        const formattedMainPost = formatPost(post);
        if (formattedMainPost && post.replies) {
            formattedMainPost.replies = post.replies.map(formatPost);
        }
        return formattedMainPost;
    }
    async createPost(userId, content, parentId, quotedPostId, mediaOptions) {
        const post = await this.prisma.post.create({
            data: {
                content,
                authorId: userId,
                parentId: parentId || null,
                conversationId: parentId || null,
                quotedPostId: quotedPostId || null,
                ...(mediaOptions || {})
            },
            include: {
                parent: true,
                quotedPost: true,
            }
        });
        if (post.parentId && post.parent && post.parent.authorId !== userId) {
            await this.prisma.notification.create({
                data: {
                    recipientId: post.parent.authorId,
                    actorId: userId,
                    type: 'REPLY',
                    postId: post.id,
                }
            });
        }
        if (post.quotedPostId && post.quotedPost && post.quotedPost.authorId !== userId) {
            await this.prisma.notification.create({
                data: {
                    recipientId: post.quotedPost.authorId,
                    actorId: userId,
                    type: 'QUOTE',
                    postId: post.id,
                }
            });
        }
        if (!post.parentId && !post.quotedPostId) {
            await this.monetizationService.processSelaReward(post);
        }
        else if (post.parentId && post.parent) {
            await this.monetizationService.processReplyReward(post, post.parent);
        }
        return post;
    }
    async toggleEngagement(userId, postId, type) {
        const existing = await this.prisma.engagement.findUnique({
            where: {
                userId_postId_type: { userId, postId, type }
            }
        });
        if (existing) {
            await this.prisma.engagement.delete({
                where: { id: existing.id }
            });
            return { status: 'removed' };
        }
        else {
            await this.prisma.engagement.create({
                data: { userId, postId, type }
            });
            const post = await this.prisma.post.findUnique({ where: { id: postId } });
            if (post && post.authorId !== userId && type !== 'BOOKMARK') {
                await this.prisma.notification.create({
                    data: {
                        recipientId: post.authorId,
                        actorId: userId,
                        type: type,
                        postId: postId,
                    }
                });
            }
            if (type === 'RESELA') {
                await this.monetizationService.processReselaReward(postId, userId);
            }
            return { status: 'added' };
        }
    }
    async incrementView(postId, currentUserId) {
        if (currentUserId) {
            const post = await this.prisma.post.findUnique({ where: { id: postId } });
            if (post && post.authorId === currentUserId) {
                return post;
            }
        }
        const updatedPost = await this.prisma.post.update({
            where: { id: postId },
            data: { viewsCount: { increment: 1 } }
        });
        await this.monetizationService.processViewMilestone(updatedPost);
        return updatedPost;
    }
    async deletePost(postId, userId) {
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });
        if (!post) {
            throw new Error("Post not found");
        }
        if (post.authorId !== userId) {
            throw new Error("Not authorized to delete this post");
        }
        await this.monetizationService.processClawback(postId);
        await this.prisma.engagement.deleteMany({
            where: { postId }
        });
        return this.prisma.post.delete({
            where: { id: postId }
        });
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        monetization_service_1.MonetizationService])
], PostsService);
//# sourceMappingURL=posts.service.js.map