import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AdminService } from './admin.service.js';
import { DashboardAppointmentsQueryDto } from './dto/dashboard-appointments-query.dto.js';
import { DashboardRevenueQueryDto } from './dto/dashboard-revenue-query.dto.js';

import { ActorGuard } from '../../common/guards/actor.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRoleEnum } from '../../common/enum/user.enum.js';

@Controller('admin')
@UseGuards(ActorGuard, RolesGuard)
@Roles(UserRoleEnum.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
  ) {}

  @Get('dashboard/summary')
  getDashboardSummary() {
    return this.adminService.getDashboardSummary();
  }

  @Get('dashboard/appointments')
  getAppointmentsReport(
    @Query() query: DashboardAppointmentsQueryDto,
  ) {
    return this.adminService.getAppointmentsReport(query);
  }

  @Get('dashboard/revenue')
  getRevenueReport(
    @Query() query: DashboardRevenueQueryDto,
  ) {
    return this.adminService.getRevenueReport(query);
  }
}