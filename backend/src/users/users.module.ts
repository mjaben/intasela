import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UserProcessor } from './users.processor';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'user-tasks',
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, UserProcessor],
  exports: [UsersService, BullModule],
})
export class UsersModule {}
