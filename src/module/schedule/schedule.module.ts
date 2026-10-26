import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ScheduleController } from './schedule.controller.js';
import { ScheduleService } from './schedule.service.js';

import {
  Schedule,
  ScheduleModel,
} from '../../database/model/schedule.model.js';

import { Staff, StaffModel } from '../../database/model/staff.model.js';

import {
  Hospital,
  HospitalModel,
} from '../../database/model/hospital.model.js';

import {
  Department,
  DepartmentModel,
} from '../../database/model/department.model.js';

import { User, UserModel } from '../../database/model/user.model.js';

import {
  Appointment,
  AppointmentModel,
} from '../../database/model/appointment.model.js';

import { TokenModule } from '../../common/services/token.module.js';
import {
  ScheduleException,
  ScheduleExceptionModel,
} from '../../database/model/schedule-exception.model.js';

@Module({
  imports: [
    TokenModule,
    MongooseModule.forFeature([
      { name: Schedule.name, schema: ScheduleModel },
      { name: Staff.name, schema: StaffModel },
      { name: Hospital.name, schema: HospitalModel },
      { name: Department.name, schema: DepartmentModel },
      { name: User.name, schema: UserModel },
      { name: Appointment.name, schema: AppointmentModel },
      { name: ScheduleException.name, schema: ScheduleExceptionModel },
    ]),
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
