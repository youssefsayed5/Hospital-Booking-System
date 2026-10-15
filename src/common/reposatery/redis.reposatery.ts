import { Inject, Injectable } from '@nestjs/common';
import type { RedisClientType } from 'redis';

export interface IRedisRepo {
  set(
    key: string,
    value: string,
    expiresInSeconds?: number,
  ): Promise<string | null>;
  get(key: string): Promise<string | null>;
  del(key: string | string[]): Promise<number>;
  delByPattern(pattern: string): Promise<number>;
  exists(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<boolean>;
  ttl(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  decr(key: string): Promise<number>;
  setIfNotExists(
    key: string,
    value: string,
    expiresInSeconds: number,
  ): Promise<string | null>;
  getAndDelete(key: string): Promise<string | null>;
  flushDb(): Promise<string>;
}

@Injectable()
export class RedisRepo implements IRedisRepo {
  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: RedisClientType,
  ) {}

  async set(key: string, value: string, expiresInSeconds?: number) {
    return this.redis.set(key, value, {
      ...(expiresInSeconds ? { EX: expiresInSeconds } : {}),
    });
  }

  async get(key: string) {
    return this.redis.get(key);
  }

  async del(key: string | string[]) {
    return this.redis.del(key);
  }

  async delByPattern(pattern: string): Promise<number> {
    let deleted = 0;

    for await (const result of this.redis.scanIterator({
      MATCH: pattern,
      COUNT: 100,
    })) {
      const keys: string[] = Array.isArray(result)
        ? (result as string[])
        : [result as string];

      if (keys.length > 0) {
        deleted += await this.redis.del(keys);
      }
    }

    return deleted;
  }

  async exists(key: string) {
    return this.redis.exists(key);
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    return (await this.redis.expire(key, seconds)) === 1;
  }

  async ttl(key: string) {
    return this.redis.ttl(key);
  }

  async incr(key: string) {
    return this.redis.incr(key);
  }

  async decr(key: string) {
    return this.redis.decr(key);
  }

  async setIfNotExists(key: string, value: string, expiresInSeconds: number) {
    return this.redis.set(key, value, {
      EX: expiresInSeconds,
      NX: true,
    });
  }

  async getAndDelete(key: string) {
    return this.redis.getDel(key);
  }

  async flushDb() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('flushDb is disabled in production');
    }
    return this.redis.flushDb();
  }
}
