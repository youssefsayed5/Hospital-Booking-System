import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

import { User, UserModel } from '../../database/model/user.model.js';

import { Staff, StaffModel } from '../../database/model/staff.model.js';

import { EmailModule } from '../../common/email/email.module.js';
import { TokenModule } from '../../common/services/token.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserModel,
      },
      {
        name: Staff.name,
        schema: StaffModel,
      },
    ]),
    EmailModule,
    TokenModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
