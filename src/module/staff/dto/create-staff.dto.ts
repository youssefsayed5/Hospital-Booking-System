import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsMongoId,
  IsPhoneNumber,
  IsString,
  Length,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { StaffType } from '../../../common/enum/Staff.enum.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateStaffDto {
  @Transform(trim)
  @IsString()
  @Length(2, 100)
  name!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;

  @IsPhoneNumber('EG')
  phone!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(StaffType)
  type!: StaffType;

  @IsMongoId()
  hospital!: string;

  @ValidateIf(
    (o: CreateStaffDto) =>
      o.type === StaffType.DOCTOR || o.department !== undefined,
  )
  @IsMongoId()
  department?: string;
}
