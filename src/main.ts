import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module.js';

import {
  changePasswordRateLimit,
  generalRateLimit,
  loginRateLimit,
  sendOtpRateLimit,
} from './common/middleware/rateLimit/rateLimit.js';

import { RedisRepo } from './common/reposatery/redis.reposatery.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const redisRepo = app.get(RedisRepo);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use('/api', generalRateLimit(redisRepo));

  app.use('/api/auth/login', loginRateLimit(redisRepo));
  app.use('/api/auth/staff/login', loginRateLimit(redisRepo));

  app.use('/api/auth/signup', sendOtpRateLimit(redisRepo));
  app.use('/api/auth/resend-otp', sendOtpRateLimit(redisRepo));
  app.use('/api/auth/forget-password', sendOtpRateLimit(redisRepo));

  app.use(
    '/api/auth/reset-password',
    changePasswordRateLimit(redisRepo),
  );

  const port = Number(configService.get<string>('PORT', '8000'));

  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('PORT must be an integer between 0 and 65535');
  }

  await app.listen(port);

  console.log(`Server running at http://localhost:${port}/api`);
}

await bootstrap();
