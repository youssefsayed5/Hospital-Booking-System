import path from 'node:path';
import { existsSync } from 'node:fs';
import { config } from 'dotenv';
import { z } from 'zod';

const nodeEnv = process.env.NODE_ENV || 'dev';

const envFileCandidates = [
  path.resolve(process.cwd(), 'src', 'config', `${nodeEnv}.env`),
  path.resolve(process.cwd(), 'config', `${nodeEnv}.env`),
  path.resolve(process.cwd(), `${nodeEnv}.env`),
];

const envFilePath =
  envFileCandidates.find((candidate) => existsSync(candidate)) ??
  envFileCandidates[0];

const result = config({ path: envFilePath });

if (result.error) {
  console.error(`Failed to load environment file: ${envFilePath}`);
  throw result.error;
}

const schema = z.object({
  PORT: z.coerce.number().default(3000),

  SALT: z.coerce.number().default(10),

  ITERATIONS: z.coerce.number().default(100000),

  ADMIN_ACCESS_SIGNATURE: z.string().min(32),
  USER_ACCESS_SIGNATURE: z.string().min(32),

  ADMIN_REFRESH_SIGNATURE: z.string().min(32),
  USER_REFRESH_SIGNATURE: z.string().min(32),

  STAFF_ACCESS_SIGNATURE: z.string().min(32),
  STAFF_REFRESH_SIGNATURE: z.string().min(32),

  JWT_EXPIRES_USER: z.string().default('1h'),
  JWT_EXPIRES_ADMIN: z.string().default('2h'),
  JWT_EXPIRES_STAFF: z.string().default('1h'),

  JWT_EXPIRES_USER_refresh: z.string().default('7d'),
  JWT_EXPIRES_ADMIN_refresh: z.string().default('7d'),
  JWT_EXPIRES_STAFF_refresh: z.string().default('7d'),

  GOOGLE_ACCOUNT: z.string().min(1),
  PASSWORD_ACCOUNT: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),

  DATABASE_URL: z.string().min(1),
  SERVER_URL: z.string().min(1),
  REDIS_CONNECTION: z.string().min(1),

  JWT_SECRET: z.string().min(32),

  AWS_REGION: z.string().min(1),
  AWS_BUCKET_NAME: z.string().min(1),

  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  PAYMENT_WEBHOOK_SECRET: z.string().min(1),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    'Invalid environment variables:',
    parsed.error.flatten().fieldErrors,
  );

  process.exit(1);
}

const e = parsed.data;

export const env = {
  nodeEnv,

  port: e.PORT,

  salt: e.SALT,
  iterations: e.ITERATIONS,

  adminAccessSignature: e.ADMIN_ACCESS_SIGNATURE,
  userAccessSignature: e.USER_ACCESS_SIGNATURE,
  staffAccessSignature: e.STAFF_ACCESS_SIGNATURE,

  adminRefreshSignature: e.ADMIN_REFRESH_SIGNATURE,
  userRefreshSignature: e.USER_REFRESH_SIGNATURE,
  staffRefreshSignature: e.STAFF_REFRESH_SIGNATURE,

  googleAccount: e.GOOGLE_ACCOUNT,
  passwordAccount: e.PASSWORD_ACCOUNT,
  googleClientId: e.GOOGLE_CLIENT_ID,

  databaseUrl: e.DATABASE_URL,
  serverUrl: e.SERVER_URL,
  redisConnection: e.REDIS_CONNECTION,

  jwtSecret: e.JWT_SECRET,

  jwtExpiresUser: e.JWT_EXPIRES_USER,
  jwtExpiresAdmin: e.JWT_EXPIRES_ADMIN,
  jwtExpiresStaff: e.JWT_EXPIRES_STAFF,

  jwtExpiresUserRefresh: e.JWT_EXPIRES_USER_refresh,
  jwtExpiresAdminRefresh: e.JWT_EXPIRES_ADMIN_refresh,
  jwtExpiresStaffRefresh: e.JWT_EXPIRES_STAFF_refresh,

  awsRegion: e.AWS_REGION,
  awsBucketName: e.AWS_BUCKET_NAME,

  cloudinaryCloudName: e.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: e.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: e.CLOUDINARY_API_SECRET,
  paymentWebhookSecret: e.PAYMENT_WEBHOOK_SECRET,
} as const;
