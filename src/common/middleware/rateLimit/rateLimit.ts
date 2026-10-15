import type { NextFunction, Request, Response } from 'express';
import { RedisRepo } from '../../reposatery/redis.reposatery.js';

type RateLimitOptions = {
  keyPrefix: string;
  windowMs: number;
  max?: number;
  limit?: number;
  message: unknown;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
};

function rateLimit(options: RateLimitOptions) {
  const limit = options.limit ?? options.max ?? 100;

  return (redisRepo: RedisRepo) =>
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
      const now = Date.now();
      const bucket = Math.floor(now / options.windowMs);
      const key = `rl:${options.keyPrefix}:${bucket}:${ip}`;

      try {
        const count = await redisRepo.incr(key);

        await redisRepo.expire(key, Math.ceil(options.windowMs / 1000) + 5);

        const remaining = Math.max(0, limit - count);
        const resetAt = (bucket + 1) * options.windowMs;

        if (options.standardHeaders) {
          res.setHeader('RateLimit-Limit', String(limit));
          res.setHeader('RateLimit-Remaining', String(remaining));
          res.setHeader(
            'RateLimit-Reset',
            String(Math.ceil((resetAt - now) / 1000)),
          );
        }

        if (count > limit) {
          res.status(429).json(options.message);
          return;
        }

        next();
      } catch (error) {
        next(error);
      }
    };
}

export const loginRateLimit = rateLimit({
  keyPrefix: 'login',
  windowMs: 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 1 minute.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const changePasswordRateLimit = rateLimit({
  keyPrefix: 'change-password',
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many password change attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const sendOtpRateLimit = rateLimit({
  keyPrefix: 'send-otp',
  windowMs: 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again after 1 minute.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalRateLimit = rateLimit({
  keyPrefix: 'general',
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});
