import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { ScheduleExceptionType } from '../../../common/enum/schedule.enum.js';
import { ScheduleBreakDto } from './create-schedule.dto.js';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class CreateScheduleExceptionDto {
  @IsMongoId()
  @IsNotEmpty()
  scheduleId!: string;

  @IsDateString({ strict: true })
  @Matches(DATE_REGEX, {
    message: 'Date must use YYYY-MM-DD format',
  })
  date!: string;

  @IsEnum(ScheduleExceptionType)
  type!: ScheduleExceptionType;

  @ValidateIf(
    (dto: CreateScheduleExceptionDto) =>
      dto.type === ScheduleExceptionType.CUSTOM_HOURS,
  )
  @IsString()
  @Matches(TIME_REGEX, {
    message: 'Start time must use HH:mm format',
  })
  startTime?: string;

  @ValidateIf(
    (dto: CreateScheduleExceptionDto) =>
      dto.type === ScheduleExceptionType.CUSTOM_HOURS,
  )
  @IsString()
  @Matches(TIME_REGEX, {
    message: 'End time must use HH:mm format',
  })
  endTime?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ScheduleBreakDto)
  breaks?: ScheduleBreakDto[];

  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
