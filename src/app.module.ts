import * as path from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { AuthModule } from './module/auth/auth.module.js';
import { UserModule } from './module/user/user.module.js';
import { StaffModule } from './module/staff/staff.module.js';
import { HospitalModule } from './module/hospital/hospital.module.js';
import { DepartmentModule } from './module/department/department.module.js';
import { AppointmentModule } from './module/appointment/appointment.module.js';

import { MongoConnectionModule } from './database/connctionMongo.js';
import { RedisConnectionModule } from './database/connectionRedis.js';
import { EmailModule } from './common/email/email.module.js';
import { TokenModule } from './common/services/token.module.js';
import { ScheduleModule } from './module/schedule/schedule.module.js';
import { PaymentModule } from './module/payment/payment.module.js';
import { AdminModule } from './module/admin/admin.module.js';

const nodeEnv = process.env.NODE_ENV || 'dev';

const envFilePath = path.resolve(
  process.cwd(),
  'src',
  'config',
  `${nodeEnv}.env`,
);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
      cache: true,
    }),

    MongoConnectionModule,
    RedisConnectionModule,
    EmailModule,
    TokenModule,

    AuthModule,
    UserModule,
    StaffModule,
    HospitalModule,
    DepartmentModule,
    AppointmentModule,
    ScheduleModule,
    PaymentModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
