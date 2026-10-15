import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateStaffDto } from './create-staff.dto.js';

export class UpdateStaffDto extends PartialType(
  PickType(CreateStaffDto, ['name', 'phone', 'email'] as const),
) {}
