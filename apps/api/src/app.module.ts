import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { SearchModule } from './search/search.module';
import { ListsModule } from './lists/lists.module';
import { AiModule } from './ai/ai.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { ValidationModule } from './validation/validation.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { ProcessorsModule } from './queues/processors.module';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        stores: [new KeyvRedis(REDIS_URL)],
        ttl: 60_000,
      }),
    }),
    BullModule.forRoot({
      connection: { url: REDIS_URL, maxRetriesPerRequest: null },
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
    SearchModule,
    ListsModule,
    AiModule,
    CampaignsModule,
    ValidationModule,
    DashboardModule,
    IntegrationsModule,
    // Single-dyno hosting mounts the queue processors in-process;
    // docker-compose runs them in a dedicated worker container instead.
    ...(process.env.INLINE_WORKER === '1' ? [ProcessorsModule] : []),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
