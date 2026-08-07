import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { UploadsModule } from './uploads/uploads.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MonetizationModule } from './monetization/monetization.module';
import { AuditLogInterceptor } from './security/audit.interceptor';
import { BullModule } from '@nestjs/bullmq';
import { AdsModule } from './ads/ads.module';
import { SpacesModule } from './spaces/spaces.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailModule } from './email/email.module';
import { SimulatorModule } from './simulator/simulator.module';

@Module({
  imports: [
    EmailModule,
    PrismaModule, 
    UsersModule, 
    AuthModule, 
    PostsModule,
    ScheduleModule.forRoot(),
    UploadsModule,
    NotificationsModule,
    AdsModule,
    SpacesModule,
    SimulatorModule,
    BullModule.forRootAsync({
      useFactory: () => {
        if (process.env.REDIS_URL) {
          const url = new URL(process.env.REDIS_URL);
          return {
            connection: {
              host: url.hostname,
              port: Number(url.port),
              username: url.username || 'default',
              password: url.password,
              tls: url.protocol === 'rediss:' ? {} : undefined,
            }
          };
        }
        return {
          connection: {
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
            username: process.env.REDIS_USERNAME || 'default',
            password: process.env.REDIS_PASSWORD || undefined,
            tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
          }
        };
      }
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    }
  ],
})
export class AppModule {}
