import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async getFeed() {
    return this.postsService.getFeed();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createPost(@Request() req: any, @Body() body: { content: string }) {
    // req.user is populated by JwtAuthGuard
    return this.postsService.createPost(req.user.id, body.content);
  }
}
