import { IsDateString } from 'class-validator';

export class DashboardRevenueQueryDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}
