
import { Global, Module } from '@nestjs/common';
import { createClient } from 'redis';
import { env } from '../config/env.server.js';
import { RedisRepo } from '../common/reposatery/redis.reposatery.js';

export const clientRedis = createClient({
  url: env.redisConnection as string,
});

clientRedis.on('error', (error) => {
  console.error('Redis Error:', error);
});

@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async () => {
        if (!clientRedis.isOpen) {
          await clientRedis.connect();
        }

        return clientRedis;
      },
    },
    RedisRepo,
  ],
  exports: [RedisRepo, 'REDIS_CLIENT'],
})
@Global()
export class RedisConnectionModule {}