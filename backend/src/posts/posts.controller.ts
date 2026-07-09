import { Controller, Get, Post, Body, Param, UseGuards, Request, Headers, Delete } from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private jwtService: JwtService
  ) {}

  @Get()
  async getFeed(@Headers('authorization') authHeader: string) {
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
    return this.postsService.getFeed(currentUserId);
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
  async createPost(@Request() req: any, @Body() body: { content: string, parentId?: number, quotedPostId?: number }) {
    return this.postsService.createPost(req.user.id, body.content, body.parentId, body.quotedPostId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/engage')
  async toggleEngagement(
    @Request() req: any, 
    @Param('id') id: string, 
    @Body() body: { type: string }
  ) {
    return this.postsService.toggleEngagement(req.user.id, parseInt(id), body.type);
  }

  @Post(':id/view')
  async incrementView(@Param('id') id: string) {
    return this.postsService.incrementView(parseInt(id));
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deletePost(@Request() req: any, @Param('id') id: string) {
    return this.postsService.deletePost(parseInt(id), req.user.id);
  }
}
