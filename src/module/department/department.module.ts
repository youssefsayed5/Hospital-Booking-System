import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { DepartmentService } from './department.service.js';
import { DepartmentController } from './department.controller.js';

import {
  Department,
  DepartmentModel,
} from '../../database/model/department.model.js';

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
      { name: Department.name, schema: DepartmentModel },
      { name: Hospital.name, schema: HospitalModel },
      { name: User.name, schema: UserModel },
      { name: Staff.name, schema: StaffModel },
    ]),
  ],
  controllers: [DepartmentController],
  providers: [DepartmentService],
})
export class DepartmentModule {}
