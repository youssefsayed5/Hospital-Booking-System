import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Appointment,
  AppointmentModel,
} from '../../database/model/appointment.model.js';

import {
  Hospital,
  HospitalModel,
} from '../../database/model/hospital.model.js';

import { Staff, StaffModel } from '../../database/model/staff.model.js';

import { User, UserModel } from '../../database/model/user.model.js';

import { AppointmentController } from './appointment.controller.js';
import { AppointmentService } from './appointment.service.js';
import { TokenModule } from '../../common/services/token.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Appointment.name,
        schema: AppointmentModel,
      },
      {
        name: Hospital.name,
        schema: HospitalModel,
      },
      {
        name: Staff.name,
        schema: StaffModel,
      },
      {
        name: User.name,
        schema: UserModel,
      },
    ]),
    TokenModule,
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
