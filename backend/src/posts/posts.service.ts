import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MonetizationService } from '../monetization/monetization.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  constructor(
    private prisma: PrismaService,
    private monetizationService: MonetizationService
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async publishScheduledPosts() {
    const now = new Date();
    const scheduledPosts = await this.prisma.post.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledFor: {
          lte: now
        }
      }
    });

    if (scheduledPosts.length > 0) {
      this.logger.log(`Publishing ${scheduledPosts.length} scheduled posts...`);
      for (const post of scheduledPosts) {
        await this.prisma.post.update({
          where: { id: post.id },
          data: {
            status: 'PUBLISHED',
            createdAt: now, // Update createdAt to now so it appears fresh in the feed
          }
        });
      }
      this.logger.log(`Successfully published ${scheduledPosts.length} scheduled posts.`);
    }
  }

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
    let whereClause: any = { parentId: null, status: 'PUBLISHED' };

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
        poll: { include: { options: { include: { userVotes: true } } } }, _count: {
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
    let whereClause: any = { mediaType: 'VIDEO', parentId: null, status: 'PUBLISHED' };

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
            poll: { include: { options: { include: { userVotes: true } } } }, _count: {
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
        poll: { include: { options: { include: { userVotes: true } } } }, _count: {
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
        status: 'PUBLISHED',
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
        poll: { include: { options: { include: { userVotes: true } } } }, _count: {
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
        status: 'PUBLISHED',
        author: { username },
        parentId: { not: null } // Only replies
      },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: this.getAuthorSelect(currentUserId)
        },
        poll: { include: { options: { include: { userVotes: true } } } }, _count: { select: { replies: true, engagements: true } },
        engagements: true,
        quotedPost: { include: { author: { select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true } } } },
        parent: {
          include: {
            author: { select: this.getAuthorSelect(currentUserId) },
            poll: { include: { options: { include: { userVotes: true } } } }, _count: { select: { replies: true, engagements: true } },
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
        status: 'PUBLISHED',
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
        poll: { include: { options: { include: { userVotes: true } } } }, _count: { select: { replies: true, engagements: true } },
        engagements: true,
        quotedPost: { include: { author: { select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true } } } }
      },
    });

    return posts.map(post => this.formatPost(post, currentUserId));
  }

  async getBookmarks(currentUserId: string) {
    const posts = await this.prisma.post.findMany({
      where: { 
        status: 'PUBLISHED',
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
        poll: { include: { options: { include: { userVotes: true } } } }, _count: { select: { replies: true, engagements: true } },
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

    const { engagements, parent, author, space, poll, ...rest } = post;

    let formattedPoll = undefined;
    if (poll) {
      formattedPoll = {
        ...poll,
        options: poll.options ? poll.options.map((opt: any) => ({
          id: opt.id,
          text: opt.text,
          votes: opt.votes,
          hasVoted: currentUserId && opt.userVotes ? opt.userVotes.some((v: any) => v.userId === currentUserId) : false,
        })) : []
      };
    }

    return {
      ...rest,
      author: author ? { 
        ...author, 
        name: author.firstName ? `${author.firstName} ${author.lastName || ''}`.trim() : author.username,
        isFollowing, 
        isFollower 
      } : undefined,
      parent: parent ? this.formatPost(parent, currentUserId) : undefined,
      space: space || undefined,
      poll: formattedPoll,
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
        poll: { include: { options: { include: { userVotes: true } } } }, _count: { select: { replies: true, engagements: true } },
        engagements: true,
        quotedPost: {
          include: { author: { select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true } } }
        },
        replies: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: this.getAuthorSelect(currentUserId) },
            poll: { include: { options: { include: { userVotes: true } } } }, _count: { select: { replies: true, engagements: true } },
            engagements: true,
            quotedPost: {
              include: { author: { select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true } } }
            },
            replies: {
              orderBy: { createdAt: 'desc' },
              include: {
                author: { select: this.getAuthorSelect(currentUserId) },
                poll: { include: { options: { include: { userVotes: true } } } }, _count: { select: { replies: true, engagements: true } },
                engagements: true,
                quotedPost: {
                  include: { author: { select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true } } }
                }
              }
            }
          }
        },
        parent: {
          include: {
            author: { select: this.getAuthorSelect(currentUserId) },
            poll: { include: { options: { include: { userVotes: true } } } }, _count: { select: { replies: true, engagements: true } },
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
      
      const { engagements, parent, author, poll, ...rest } = p;
      
      let formattedPoll = undefined;
      if (poll) {
        formattedPoll = {
          ...poll,
          options: poll.options ? poll.options.map((opt: any) => ({
            id: opt.id,
            text: opt.text,
            votes: opt.votes,
            hasVoted: currentUserId && opt.userVotes ? opt.userVotes.some((v: any) => v.userId === currentUserId) : false,
          })) : []
        };
      }
      
      return {
        ...rest,
        author: author ? { ...author, isFollowing, isFollower } : undefined,
        parent: parent ? formatPost(parent) : undefined,
        poll: formattedPoll,
        stats: { likes: likes.length, reselas: reselas.length, replies: p._count?.replies || 0, views: p.viewsCount || 0 },
        userInteractions: { isLiked, isReselaed, isBookmarked }
      };
    };

    const formattedMainPost = formatPost(post);
    if (formattedMainPost && post.replies) {
      formattedMainPost.replies = post.replies.map((r: any) => {
        const formattedR = formatPost(r);
        if (r.replies && r.replies.length > 0) {
          const authorReplies = r.replies.filter((r2: any) => r2.authorId === post.authorId);
          if (authorReplies.length > 0) {
            formattedR.replies = authorReplies.map(formatPost);
          } else {
            delete formattedR.replies;
          }
        } else {
          delete formattedR.replies;
        }
        return formattedR;
      });
    }

    return formattedMainPost;
  }

  async createPost(
    userId: string, 
    content: string, 
    parentId?: number, 
    quotedPostId?: number,
    mediaOptions?: { mediaUrl?: string, mediaUrls?: string[], thumbnailUrl?: string, mediaType?: string, videoWidth?: number, videoHeight?: number, videoDuration?: number },
    spaceId?: string,
    status: string = 'PUBLISHED',
    pollOptions?: string[],
    pollDurationDays?: number,
    scheduledFor?: string,
    draftId?: number
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

    let finalStatus = status;
    let scheduledDate: Date | null = null;
    
    if (scheduledFor) {
      const parsedDate = new Date(scheduledFor);
      if (parsedDate > new Date()) {
        finalStatus = 'SCHEDULED';
        scheduledDate = parsedDate;
      }
    }

    let post;
    const postData = {
      content,
      authorId: userId,
      parentId: parentId || null,
      conversationId: parentId || null,
      quotedPostId: quotedPostId || null,
      spaceId: spaceId || null,
      approvalStatus: initialApprovalStatus,
      status: finalStatus,
      scheduledFor: scheduledDate,
      ...(mediaOptions || {})
    };

    if (draftId) {
      // Ensure the draft belongs to the user
      const existingDraft = await this.prisma.post.findUnique({ where: { id: draftId } });
      if (existingDraft && existingDraft.authorId === userId && existingDraft.status === 'DRAFT') {
        post = await this.prisma.post.update({
          where: { id: draftId },
          data: postData,
          include: {
            parent: true,
            quotedPost: true,
          }
        });
      } else {
        throw new Error("Draft not found or unauthorized");
      }
    } else {
      post = await this.prisma.post.create({
        data: postData,
        include: {
          parent: true,
          quotedPost: true,
        }
      });
    }

    if (pollOptions && pollOptions.length > 0) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (pollDurationDays || 1));
      
      await this.prisma.poll.create({
        data: {
          postId: post.id,
          expiresAt,
          options: {
            create: pollOptions.map(text => ({ text }))
          }
        }
      });
    }

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
    let shouldIncrement = false;

    if (currentUserId) {
      const post = await this.prisma.post.findUnique({ where: { id: postId } });
      if (post && post.authorId === currentUserId) {
        return post; // Author viewing their own post, ignore increment
      }

      // Try to insert VIEW_1
      try {
        await this.prisma.engagement.create({
          data: {
            userId: currentUserId,
            postId,
            type: 'VIEW_1'
          }
        });
        shouldIncrement = true;
      } catch (e) {
        // VIEW_1 exists, try VIEW_2
        try {
          await this.prisma.engagement.create({
            data: {
              userId: currentUserId,
              postId,
              type: 'VIEW_2'
            }
          });
          shouldIncrement = true;
        } catch (e2) {
          // VIEW_2 also exists. User has already viewed 2 times.
          return post; // Do not increment
        }
      }
    } else {
      shouldIncrement = true; // Allow anonymous views
    }

    if (shouldIncrement) {
      const updatedPost = await this.prisma.post.update({
        where: { id: postId },
        data: { viewsCount: { increment: 1 } }
      });

      await this.monetizationService.processViewMilestone(updatedPost);
      return updatedPost;
    }
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

  async votePoll(postId: number, optionId: number, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { poll: { include: { options: true } } }
    });

    if (!post || !post.poll) {
      throw new Error("Poll not found");
    }

    if (new Date() > new Date(post.poll.expiresAt)) {
      throw new Error("Poll has expired");
    }

    const option = post.poll.options.find(o => o.id === optionId);
    if (!option) {
      throw new Error("Invalid option");
    }

    // Check if user already voted in this poll
    const existingVote = await this.prisma.pollVote.findFirst({
      where: {
        userId,
        pollOption: {
          pollId: post.poll.id
        }
      }
    });

    if (existingVote) {
      throw new Error("You have already voted in this poll");
    }

    await this.prisma.pollVote.create({
      data: {
        userId,
        pollOptionId: optionId
      }
    });

    await this.prisma.pollOption.update({
      where: { id: optionId },
      data: { votes: { increment: 1 } }
    });

    return { success: true };
  }

  async getDrafts(currentUserId: string) {
    const posts = await this.prisma.post.findMany({
      where: {
        authorId: currentUserId,
        status: 'DRAFT',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: this.getAuthorSelect(currentUserId)
        },
        poll: { include: { options: { include: { userVotes: true } } } }, _count: {
          select: { replies: true, engagements: true }
        },
        engagements: true,
      },
    });
    return posts.map(post => this.formatPost(post, currentUserId));
  }

  async getTrendingTopics() {
    const recentPosts = await this.prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      select: { content: true },
      take: 500,
      orderBy: { createdAt: 'desc' }
    });

    const hashtagCount: Record<string, { display: string, count: number }> = {};
    const hashtagRegex = /#[\w]+/g;

    for (const post of recentPosts) {
      if (!post.content) continue;
      const matches = post.content.match(hashtagRegex);
      if (matches) {
        const uniqueTags = [...new Set(matches)]; // Keep original case
        const seenLower = new Set<string>();
        for (const tag of uniqueTags) {
          const lower = tag.toLowerCase();
          if (!seenLower.has(lower)) {
            seenLower.add(lower);
            if (!hashtagCount[lower]) {
              hashtagCount[lower] = { display: tag, count: 0 };
            }
            hashtagCount[lower].count++;
          }
        }
      }
    }

    const sorted = Object.values(hashtagCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => ({
        topic: item.display,
        posts: `${item.count} selas`
      }));

    return sorted;
  }

  async searchPosts(query: string, sort: 'top' | 'latest' = 'top', mediaOnly: boolean = false, currentUserId?: string) {
    if (!query) return [];

    let fromUsername = undefined;
    let toUsername = undefined;
    let exactPhrase = undefined;
    let cleanQuery = query;

    let minReplies = 0;
    let minFaves = 0;
    let minRetweets = 0;
    let filterReplies: boolean | undefined = undefined;
    let filterLinks: boolean | undefined = undefined;
    let sinceDate: Date | undefined = undefined;
    let untilDate: Date | undefined = undefined;

    // Helper to extract and replace safely
    const extract = (regex: RegExp) => {
      const match = cleanQuery.match(regex);
      if (match) {
        cleanQuery = cleanQuery.replace(regex, '').trim();
        return match[1];
      }
      return undefined;
    };
    
    const extractBool = (regex: RegExp) => {
      const match = cleanQuery.match(regex);
      if (match) {
        cleanQuery = cleanQuery.replace(regex, '').trim();
        return true;
      }
      return false;
    };

    fromUsername = extract(/from:(\w+)/);
    toUsername = extract(/to:(\w+)/);
    
    // Exact phrase
    const exactMatch = cleanQuery.match(/"([^"]+)"/);
    if (exactMatch) {
      exactPhrase = exactMatch[1];
      cleanQuery = cleanQuery.replace(/"([^"]+)"/, '').trim();
    }

    const minRepStr = extract(/min_replies:(\d+)/);
    if (minRepStr) minReplies = parseInt(minRepStr, 10);
    const minFavStr = extract(/min_faves:(\d+)/);
    if (minFavStr) minFaves = parseInt(minFavStr, 10);
    const minRtStr = extract(/min_retweets:(\d+)/);
    if (minRtStr) minRetweets = parseInt(minRtStr, 10);

    if (extractBool(/-filter:replies/)) filterReplies = false;
    else if (extractBool(/filter:replies/)) filterReplies = true;

    if (extractBool(/-filter:links/)) filterLinks = false;
    else if (extractBool(/filter:links/)) filterLinks = true;

    const sinceStr = extract(/since:(\d{4}-\d{2}-\d{2})/);
    if (sinceStr) sinceDate = new Date(sinceStr);
    const untilStr = extract(/until:(\d{4}-\d{2}-\d{2})/);
    if (untilStr) untilDate = new Date(untilStr);

    extract(/lang:(\w+)/); // Strip lang operator for now

    const where: any = { status: 'PUBLISHED' };

    if (fromUsername) {
      where.author = { username: fromUsername };
    }
    if (toUsername) {
      where.parent = { author: { username: toUsername } };
    }
    if (mediaOnly) {
      where.mediaUrl = { not: null };
    }
    if (filterReplies === true) {
      where.parentId = { not: null };
    } else if (filterReplies === false) {
      where.parentId = null;
    }
    
    // Dates
    if (sinceDate || untilDate) {
      where.createdAt = {};
      if (sinceDate) where.createdAt.gte = sinceDate;
      if (untilDate) where.createdAt.lte = untilDate;
    }

    if (cleanQuery || exactPhrase || filterLinks !== undefined) {
      where.AND = [];
      
      if (exactPhrase) {
        where.AND.push({ content: { contains: exactPhrase, mode: 'insensitive' } });
      }

      if (filterLinks === true) {
        where.AND.push({ content: { contains: 'http', mode: 'insensitive' } });
      } else if (filterLinks === false) {
        where.AND.push({ content: { not: { contains: 'http', mode: 'insensitive' } } });
      }

      if (cleanQuery) {
        // Split by OR if it exists, otherwise split by space (AND logic)
        if (cleanQuery.includes(' OR ')) {
           const orTerms = cleanQuery.split(' OR ').filter(t => t.trim().length > 0);
           if (orTerms.length > 0) {
             where.AND.push({
               OR: orTerms.map(t => ({ content: { contains: t.trim(), mode: 'insensitive' } }))
             });
           }
        } else {
           const terms = cleanQuery.split(' ').filter(t => t.trim().length > 0);
           terms.forEach(t => {
             if (t.startsWith('-')) {
               where.AND.push({ content: { not: { contains: t.substring(1), mode: 'insensitive' } } });
             } else {
               where.AND.push({ content: { contains: t, mode: 'insensitive' } });
             }
           });
        }
      }
      
      if (where.AND.length === 0) delete where.AND;
    }

    const posts = await this.prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: this.getAuthorSelect(currentUserId) },
        parent: { include: { author: { select: this.getAuthorSelect(currentUserId) } } },
        poll: { include: { options: { include: { userVotes: true } } } },
        _count: { select: { replies: true, engagements: true } },
        engagements: true,
      },
      take: 100
    });

    let formattedPosts = posts.map(post => this.formatPost(post, currentUserId));

    if (minReplies > 0) formattedPosts = formattedPosts.filter(p => p.stats.replies >= minReplies);
    if (minFaves > 0) formattedPosts = formattedPosts.filter(p => p.stats.likes >= minFaves);
    if (minRetweets > 0) formattedPosts = formattedPosts.filter(p => p.stats.reselas >= minRetweets);

    if (sort === 'top') {
      return formattedPosts.sort((a, b) => {
        const scoreA = (a.stats.likes * 2) + (a.stats.reselas * 3) + a.stats.replies + (a.stats.views * 0.1);
        const scoreB = (b.stats.likes * 2) + (b.stats.reselas * 3) + b.stats.replies + (b.stats.views * 0.1);
        return scoreB - scoreA;
      });
    }

    return formattedPosts;
  }
}
