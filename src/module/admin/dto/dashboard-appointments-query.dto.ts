import { IsDateString, IsOptional, IsString } from 'class-validator';

export class DashboardAppointmentsQueryDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;

  @IsOptional()
  @IsString()
  status?: string;
}
