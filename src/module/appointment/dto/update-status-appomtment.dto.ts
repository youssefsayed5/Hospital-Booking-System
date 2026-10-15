import { IsEnum, Matches } from 'class-validator';
import { AppointmentStatus } from '../../../common/enum/Appointment.enum.js';
import { CreateAppointmentDto } from './create-appointment.dto.js';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateAppointmentStatusDto extends PartialType(CreateAppointmentDto) {
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;
}
