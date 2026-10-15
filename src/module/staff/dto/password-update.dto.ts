import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import type { IChangePasswordInput } from '../../../common/interface/staff.interface.js';

export class UpdateStaffPasswordDto implements IChangePasswordInput {
  @IsString()
  @IsNotEmpty()
  oldPassword!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}
