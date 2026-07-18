import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MonetizationService } from '../monetization/monetization.service';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private monetizationService: MonetizationService
  ) {}

  private getAuthorSelect(currentUserId?: string) {
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

  async getFeed(currentUserId?: string, type?: string, spaceId?: string) {
    let whereClause: any = { parentId: null };

    if (spaceId) {
      // If a specific spaceId is requested, filter exactly by it.
      // (Authorization should ensure user can view it, but since private spaces
      // aren't visible otherwise, we can rely on standard Feed logic or the frontend 
      // preventing requests if they aren't members. But let's be safe and check visibility)
      if (!currentUserId) {
         // unauthenticated can only see public spaces
         whereClause.spaceId = spaceId;
         whereClause.space = { type: 'PUBLIC' };
      } else {
         whereClause.spaceId = spaceId;
         whereClause.OR = [
            { space: { type: 'PUBLIC' } },
            { space: { members: { some: { userId: currentUserId, status: 'ACTIVE' } } } }
         ];
      }
    } else {
      if (!currentUserId) {
        whereClause.spaceId = null;
      } else {
        whereClause.OR = [
          { spaceId: null },
          { space: { members: { some: { userId: currentUserId, status: 'ACTIVE' } } } }
        ];
      }
    }

    const approvalFilter = currentUserId 
      ? { OR: [{ approvalStatus: 'APPROVED' }, { authorId: currentUserId }] }
      : { approvalStatus: 'APPROVED' };

    whereClause.AND = whereClause.AND ? [...whereClause.AND, approvalFilter] : [approvalFilter];


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
        space: { select: { id: true, name: true, type: true } },
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

  async getOrbitFeed(currentUserId?: string, type?: string, videoId?: string) {
    let whereClause: any = { mediaType: 'VIDEO', parentId: null };

    if (type === 'following' && currentUserId) {
      whereClause.author = {
        followers: {
          some: { followerId: currentUserId }
        }
      };
    }

    let initialPost = null;
    if (videoId) {
      const vId = parseInt(videoId, 10);
      if (!isNaN(vId)) {
        // Exclude the requested video from the main query
        whereClause.id = { not: vId };
        
        // Fetch the specific post
        initialPost = await this.prisma.post.findUnique({
          where: { id: vId },
          include: {
            author: {
              select: this.getAuthorSelect(currentUserId)
            },
            _count: {
              select: { replies: true, engagements: true }
            },
            engagements: true,
          },
        });
      }
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

    const finalPosts = initialPost && initialPost.mediaType === 'VIDEO' ? [initialPost, ...posts] : posts;
    return finalPosts.map(post => this.formatPost(post, currentUserId));
  }

  async getPostsByUsername(username: string, currentUserId?: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) return [];

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
      
      // Determine if this post is on the timeline purely because of a resela
      // i.e., the author is NOT the profile user
      const isReselaByProfile = post.author.username !== username;
      if (isReselaByProfile) {
        formatted.reselaedBy = username;
      }
      
      return formatted;
    });

    // Sort by whichever is newer: post creation, or the specific user's RESELA engagement
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

  async getRepliesByUsername(username: string, currentUserId?: string) {
    const posts = await this.prisma.post.findMany({
      where: { 
        author: { username },
        parentId: { not: null } // Only replies
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

  async getLikesByUsername(username: string, currentUserId?: string) {
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

  async getBookmarks(currentUserId: string) {
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

  private formatPost(post: any, currentUserId?: string): any {
    if (!post) return null;
    const likes = post.engagements ? post.engagements.filter((e: any) => e.type === 'LIKE') : [];
    const reselas = post.engagements ? post.engagements.filter((e: any) => e.type === 'RESELA') : [];
    const bookmarks = post.engagements ? post.engagements.filter((e: any) => e.type === 'BOOKMARK') : [];
    
    const isLiked = currentUserId ? likes.some((e: any) => e.userId === currentUserId) : false;
    const isReselaed = currentUserId ? reselas.some((e: any) => e.userId === currentUserId) : false;
    const isBookmarked = currentUserId ? bookmarks.some((e: any) => e.userId === currentUserId) : false;
    const isFollowing = currentUserId && post.author?.followers && post.author.followers.length > 0;
    const isFollower = currentUserId && post.author?.following && post.author.following.length > 0;

    const { engagements, parent, author, space, ...rest } = post;

    return {
      ...rest,
      author: author ? { ...author, isFollowing, isFollower } : undefined,
      parent: parent ? this.formatPost(parent, currentUserId) : undefined,
      space: space || undefined,
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

  async getPostById(postId: number, currentUserId?: string) {
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

    if (!post) return null;

    // Helper to format a post
    const formatPost = (p: any): any => {
      if (!p) return null;
      const likes = p.engagements ? p.engagements.filter((e: any) => e.type === 'LIKE') : [];
      const reselas = p.engagements ? p.engagements.filter((e: any) => e.type === 'RESELA') : [];
      const bookmarks = p.engagements ? p.engagements.filter((e: any) => e.type === 'BOOKMARK') : [];
      const isLiked = currentUserId ? likes.some((e: any) => e.userId === currentUserId) : false;
      const isReselaed = currentUserId ? reselas.some((e: any) => e.userId === currentUserId) : false;
      const isBookmarked = currentUserId ? bookmarks.some((e: any) => e.userId === currentUserId) : false;
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

  async createPost(
    userId: string, 
    content: string, 
    parentId?: number, 
    quotedPostId?: number,
    mediaOptions?: { mediaUrl?: string, mediaUrls?: string[], thumbnailUrl?: string, mediaType?: string, videoWidth?: number, videoHeight?: number, videoDuration?: number },
    spaceId?: string
  ) {
    if (spaceId) {
      const member = await this.prisma.spaceMember.findUnique({
        where: { spaceId_userId: { spaceId, userId } }
      });
      if (!member || member.status !== 'ACTIVE') {
        throw new Error("Not authorized to post in this space");
      }
    }

    let initialApprovalStatus = 'APPROVED';

    if (spaceId) {
      const space = await this.prisma.space.findUnique({ where: { id: spaceId } });
      const member = await this.prisma.spaceMember.findUnique({
        where: { spaceId_userId: { spaceId, userId } }
      });
      
      if (space && member && member.role !== 'MODERATOR' && member.role !== 'ADMIN') {
        if (space.postApprovalMode === 'ALL_POSTS') {
          initialApprovalStatus = 'PENDING';
        } else if (space.postApprovalMode === 'FIRST_POST_ONLY' && !member.hasApprovedPost) {
          initialApprovalStatus = 'PENDING';
        }
      }
    }

    const post = await this.prisma.post.create({
      data: {
        content,
        authorId: userId,
        parentId: parentId || null,
        conversationId: parentId || null,
        quotedPostId: quotedPostId || null,
        spaceId: spaceId || null,
        approvalStatus: initialApprovalStatus,
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

    // Process Monetization Rewards (only if not pending)
    if (initialApprovalStatus === 'APPROVED') {
      if (!post.parentId && !post.quotedPostId) {
        // Top-level original post (Sela)
        await this.monetizationService.processSelaReward(post);
      } else if (post.parentId && post.parent) {
        // Reply to a post
        await this.monetizationService.processReplyReward(post, post.parent);
      }
    }

    return post;
  }

  async approvePost(postId: number, currentUserId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { parent: true, quotedPost: true, space: true }
    });

    if (!post) throw new Error("Post not found");
    if (!post.spaceId) throw new Error("This post is not in a space");
    if (post.approvalStatus === 'APPROVED') throw new Error("Post is already approved");

    // Check if currentUserId is a moderator or admin of the space
    const member = await this.prisma.spaceMember.findUnique({
      where: { spaceId_userId: { spaceId: post.spaceId, userId: currentUserId } }
    });

    let isAdmin = false;
    const sysAdmin = await this.prisma.systemAdmin.findUnique({ where: { id: currentUserId } });
    if (sysAdmin) isAdmin = true;

    if (!isAdmin && (!member || (member.role !== 'MODERATOR' && member.role !== 'ADMIN'))) {
      throw new Error("Not authorized to approve posts in this space");
    }

    await this.prisma.post.update({
      where: { id: postId },
      data: { approvalStatus: 'APPROVED' }
    });

    if (post.space && post.space.postApprovalMode === 'FIRST_POST_ONLY') {
      await this.prisma.spaceMember.updateMany({
        where: { spaceId: post.spaceId, userId: post.authorId },
        data: { hasApprovedPost: true }
      });
    }

    try {
      // Trigger deferred monetization
      if (!post.parentId && !post.quotedPostId) {
        await this.monetizationService.processSelaReward(post);
      } else if (post.parentId && post.parent) {
        await this.monetizationService.processReplyReward(post, post.parent);
      }

      // Optional: send notification to author
      await this.prisma.notification.create({
        data: {
          recipientId: post.authorId,
          actorId: currentUserId,
          type: 'SYSTEM', // or custom type
          postId: post.id,
        }
      });
    } catch (e) {
      console.error("Non-critical error during post approval side-effects:", e);
    }

    return { message: "Post approved successfully" };
  }

  async rejectPost(postId: number, currentUserId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) throw new Error("Post not found");
    if (!post.spaceId) throw new Error("This post is not in a space");
    if (post.approvalStatus === 'APPROVED') throw new Error("Cannot reject an already approved post");

    // Check authorization
    const member = await this.prisma.spaceMember.findUnique({
      where: { spaceId_userId: { spaceId: post.spaceId, userId: currentUserId } }
    });

    let isAdmin = false;
    const sysAdmin = await this.prisma.systemAdmin.findUnique({ where: { id: currentUserId } });
    if (sysAdmin) isAdmin = true;

    if (!isAdmin && (!member || (member.role !== 'MODERATOR' && member.role !== 'ADMIN'))) {
      throw new Error("Not authorized to reject posts in this space");
    }

    await this.prisma.post.update({
      where: { id: postId },
      data: { approvalStatus: 'REJECTED' }
    });

    return { message: "Post rejected successfully" };
  }

  async toggleEngagement(userId: string, postId: number, type: string) {
    // Check if engagement exists
    const existing = await this.prisma.engagement.findUnique({
      where: {
        userId_postId_type: { userId, postId, type }
      }
    });

    if (existing) {
      // Remove it (Unlike / Unresela)
      await this.prisma.engagement.delete({
        where: { id: existing.id }
      });
      return { status: 'removed' };
    } else {
      // Create it
      await this.prisma.engagement.create({
        data: { userId, postId, type }
      });

      // Create Notification if actor is not the author and type is not BOOKMARK
      const post = await this.prisma.post.findUnique({ where: { id: postId } });
      if (post && post.authorId !== userId && type !== 'BOOKMARK') {
        await this.prisma.notification.create({
          data: {
            recipientId: post.authorId,
            actorId: userId,
            type: type, // "LIKE" or "RESELA"
            postId: postId,
          }
        });
      }

      // Process Resela Monetization
      if (type === 'RESELA') {
        await this.monetizationService.processReselaReward(postId, userId);
      }

      return { status: 'added' };
    }
  }

  async incrementView(postId: number, currentUserId?: string) {
    if (currentUserId) {
      const post = await this.prisma.post.findUnique({ where: { id: postId } });
      if (post && post.authorId === currentUserId) {
        return post; // Author viewing their own post, ignore increment
      }
    }

    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: { viewsCount: { increment: 1 } }
    });

    await this.monetizationService.processViewMilestone(updatedPost);
    return updatedPost;
  }

  async deletePost(postId: number, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    if (post.authorId !== userId) {
      throw new Error("Not authorized to delete this post");
    }

    // Since we don't have onDelete: Cascade enabled for all relations,
    // we need to manually clean up engagements first. 
    // For replies/quotes, if Prisma restricts delete, we might need a soft-delete approach.
    // For now, let's try to delete engagements and then the post.
    
    // Step 1: Clawback earnings derived from this post or its child engagements
    await this.monetizationService.processClawback(postId);

    await this.prisma.engagement.deleteMany({
      where: { postId }
    });

    return this.prisma.post.delete({
      where: { id: postId }
    });
  }
}
