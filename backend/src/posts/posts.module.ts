import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MonetizationModule } from '../monetization/monetization.module';

@Module({
  imports: [PrismaModule, MonetizationModule],
  providers: [PostsService],
  controllers: [PostsController]
})
export class PostsModule {}
