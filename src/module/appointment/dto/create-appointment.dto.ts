import {
  IsDateString,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsMongoId()
  hospital: string;

  @IsMongoId()
  doctor: string;

  @IsDateString()
  appointmentDate: string;



  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'endTime must be in HH:mm format',
  })
  endTime: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime!: string;
}
