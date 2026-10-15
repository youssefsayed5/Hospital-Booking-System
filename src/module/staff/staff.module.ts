import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { StaffService } from './staff.service.js';
import { StaffController } from './staff.controller.js';

import { Staff, StaffModel } from '../../database/model/staff.model.js';

import { User, UserModel } from '../../database/model/user.model.js';

import {
  Hospital,
  HospitalModel,
} from '../../database/model/hospital.model.js';

import {
  Department,
  DepartmentModel,
} from '../../database/model/department.model.js';

import { TokenModule } from '../../common/services/token.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Staff.name, schema: StaffModel },
      { name: User.name, schema: UserModel },
      { name: Hospital.name, schema: HospitalModel },
      { name: Department.name, schema: DepartmentModel },
    ]),
    TokenModule,
  ],
  controllers: [StaffController],
  providers: [StaffService],
})
export class StaffModule {}
