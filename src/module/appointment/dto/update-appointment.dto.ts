import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateAppointmentDto } from './create-appointment.dto.js';

export class UpdateAppointmentDto extends PartialType(
  OmitType(CreateAppointmentDto, ['hospital', 'doctor'] as const),
) {}
