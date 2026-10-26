import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { ScheduleExceptionType } from '../../../common/enum/schedule.enum.js';
import { ScheduleBreakDto } from './create-schedule.dto.js';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class UpdateScheduleExceptionDto {
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(DATE_REGEX)
  date?: string;

  @IsOptional()
  @IsEnum(ScheduleExceptionType)
  type?: ScheduleExceptionType;

  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX)
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX)
  endTime?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleBreakDto)
  breaks?: ScheduleBreakDto[];

  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
