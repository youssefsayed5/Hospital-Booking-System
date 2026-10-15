import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { HospitalService } from './hospital.service.js';
import { HospitalController } from './hospital.controller.js';

import {
  Hospital,
  HospitalModel,
} from '../../database/model/hospital.model.js';

import { User, UserModel } from '../../database/model/user.model.js';

import { Staff, StaffModel } from '../../database/model/staff.model.js';

import { TokenModule } from '../../common/services/token.module.js';

@Module({
  imports: [
    TokenModule,
    MongooseModule.forFeature([
      { name: Hospital.name, schema: HospitalModel },
      { name: User.name, schema: UserModel },
      { name: Staff.name, schema: StaffModel },
    ]),
  ],
  controllers: [HospitalController],
  providers: [HospitalService],
})
export class HospitalModule {}
