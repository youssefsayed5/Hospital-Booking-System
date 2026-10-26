import { IsDateString, IsMongoId, IsNotEmpty, Matches } from 'class-validator';

export class ScheduleAvailabilityDto {
  @IsMongoId()
  @IsNotEmpty()
  doctorId!: string;

  @IsDateString(
    { strict: true },
    { message: 'Date must be a valid date in YYYY-MM-DD format' },
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must use YYYY-MM-DD format',
  })
  date!: string;
}
