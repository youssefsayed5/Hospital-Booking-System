import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';

import { User, UserModel } from '../../database/model/user.model.js';

import { Staff, StaffModel } from '../../database/model/staff.model.js';

import { EmailModule } from '../../common/email/email.module.js';
import { TokenModule } from '../../common/services/token.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserModel },
      { name: Staff.name, schema: StaffModel },
    ]),
    EmailModule,
    TokenModule,
    AuthModule,
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
