import { Controller, Get, Post, Body, Param, UseGuards, Request, Headers, Delete, Query } from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { CreatePostDto } from './dto/create-post.dto';
import { EngageDto } from './dto/engage.dto';
import { VotePollDto } from './dto/vote-poll.dto';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private jwtService: JwtService
  ) {}

  @Get()
  async getFeed(@Headers('authorization') authHeader: string, @Query('type') type?: string, @Query('spaceId') spaceId?: string) {
    let currentUserId: string | undefined;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = this.jwtService.verify(token);
        currentUserId = decoded.sub;
      } catch (e) {
        // invalid token, treat as anonymous
      }
    }
    return this.postsService.getFeed(currentUserId, type, spaceId);
  }

  @Get('orbit')
  async getOrbitFeed(
    @Query('type') type?: string, 
    @Query('videoId') videoId?: string,
    @Headers('authorization') authHeader?: string
  ) {
    let currentUserId: string | undefined;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = this.jwtService.verify(token);
        currentUserId = decoded.sub;
      } catch (e) {}
    }
    return this.postsService.getOrbitFeed(currentUserId, type, videoId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('bookmarks')
  async getBookmarks(@Request() req: any) {
    return this.postsService.getBookmarks(req.user.id);
  }

  @Get('user/:username')
  async getPostsByUsername(@Param('username') username: string, @Headers('authorization') authHeader: string) {
    let currentUserId: string | undefined;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = this.jwtService.verify(token);
        currentUserId = decoded.sub;
      } catch (e) {}
    }
    return this.postsService.getPostsByUsername(username, currentUserId);
  }

  @Get('user/:username/replies')
  async getRepliesByUsername(@Param('username') username: string, @Headers('authorization') authHeader: string) {
    let currentUserId: string | undefined;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = this.jwtService.verify(token);
        currentUserId = decoded.sub;
      } catch (e) {}
    }
    return this.postsService.getRepliesByUsername(username, currentUserId);
  }

  @Get('user/:username/likes')
  async getLikesByUsername(@Param('username') username: string, @Headers('authorization') authHeader: string) {
    let currentUserId: string | undefined;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = this.jwtService.verify(token);
        currentUserId = decoded.sub;
      } catch (e) {}
    }
    return this.postsService.getLikesByUsername(username, currentUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('drafts')
  async getDrafts(@Request() req: any) {
    return this.postsService.getDrafts(req.user.id);
  }

  @Get('trending/topics')
  async getTrendingTopics() {
    return this.postsService.getTrendingTopics();
  }

  @Get('search')
  async searchPosts(
    @Query('q') q: string, 
    @Query('sort') sort: string, 
    @Query('media_only') mediaOnly: string,
    @Headers('authorization') authHeader: string
  ) {
    let currentUserId: string | undefined;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = this.jwtService.verify(token);
        currentUserId = decoded.sub;
      } catch (e) {}
    }
    return this.postsService.searchPosts(q, sort as 'top' | 'latest', mediaOnly === 'true', currentUserId);
  }

  @Get(':id')
  async getPostById(@Param('id') id: string, @Headers('authorization') authHeader: string) {
    let currentUserId: string | undefined;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = this.jwtService.verify(token);
        currentUserId = decoded.sub;
      } catch (e) {
        // invalid token, treat as anonymous
      }
    }
    return this.postsService.getPostById(parseInt(id), currentUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createPost(@Request() req: any, @Body() body: CreatePostDto) {
    return this.postsService.createPost(req.user.id, body.content, body.parentId, body.quotedPostId, {
      mediaUrl: body.mediaUrl,
      mediaUrls: body.mediaUrls,
      thumbnailUrl: body.thumbnailUrl,
      mediaType: body.mediaType,
      videoWidth: body.videoWidth,
      videoHeight: body.videoHeight,
      videoDuration: body.videoDuration
    }, body.spaceId, body.status, body.pollOptions, body.pollDurationDays, body.scheduledFor, body.draftId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/poll/vote')
  async votePoll(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: VotePollDto
  ) {
    return this.postsService.votePoll(parseInt(id), body.optionId, req.user.id);
  }


  @UseGuards(JwtAuthGuard)
  @Post(':id/engage')
  async toggleEngagement(
    @Request() req: any, 
    @Param('id') id: string, 
    @Body() body: EngageDto
  ) {
    return this.postsService.toggleEngagement(req.user.id, parseInt(id), body.type);
  }

  @Post(':id/view')
  async incrementView(@Param('id') id: string, @Headers('authorization') authHeader?: string) {
    let currentUserId: string | undefined;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = this.jwtService.verify(token);
        currentUserId = decoded.sub;
      } catch (e) {}
    }
    return this.postsService.incrementView(parseInt(id), currentUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/approve')
  async approvePost(@Param('id') id: string, @Request() req: any) {
    return this.postsService.approvePost(parseInt(id), req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reject')
  async rejectPost(@Param('id') id: string, @Request() req: any) {
    return this.postsService.rejectPost(parseInt(id), req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deletePost(@Request() req: any, @Param('id') id: string) {
    return this.postsService.deletePost(parseInt(id), req.user.id);
  }
}
