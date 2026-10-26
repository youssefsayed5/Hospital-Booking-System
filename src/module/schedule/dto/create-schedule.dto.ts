import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import {
  WEEK_DAYS,
  type WeekDay,
} from '../../../common/interface/schedule.interface.js';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class ScheduleBreakDto {
  @IsString()
  @Matches(TIME_REGEX, {
    message: 'Break start time must be in HH:mm format',
  })
  startTime!: string;

  @IsString()
  @Matches(TIME_REGEX, {
    message: 'Break end time must be in HH:mm format',
  })
  endTime!: string;
}

export class ScheduleDayDto {
  @IsIn(WEEK_DAYS)
  day!: WeekDay;

  @IsBoolean()
  isWorkingDay!: boolean;

  @ValidateIf(
    (obj: ScheduleDayDto) => obj.isWorkingDay || obj.startTime !== undefined,
  )
  @IsString()
  @Matches(TIME_REGEX, {
    message: 'Start time must be in HH:mm format',
  })
  startTime?: string;

  @ValidateIf(
    (obj: ScheduleDayDto) => obj.isWorkingDay || obj.endTime !== undefined,
  )
  @IsString()
  @Matches(TIME_REGEX, {
    message: 'End time must be in HH:mm format',
  })
  endTime?: string;

  @ValidateIf((_obj, value) => value !== undefined)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleBreakDto)
  breaks?: ScheduleBreakDto[];
}

export class CreateScheduleDto {
  @IsMongoId()
  @IsNotEmpty()
  doctor!: string;

  @IsMongoId()
  @IsNotEmpty()
  hospital!: string;

  @IsOptional()
  @IsMongoId()
  department?: string | null;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ScheduleDayDto)
  days!: ScheduleDayDto[];

  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(240)
  slotDurationMinutes!: number;

  @ValidateIf((_obj, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  timezone?: string;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string | null;

  @ValidateIf((_obj, value) => value !== undefined)
  @IsBoolean()
  isActive?: boolean;
}
