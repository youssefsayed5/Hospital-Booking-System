import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ScheduleService } from './schedule.service.js';

import { CreateScheduleDto } from './dto/create-schedule.dto.js';
import { UpdateScheduleDto } from './dto/update-schedule.dto.js';
import { ScheduleAvailabilityDto } from './dto/schedule-availability.dto.js';

import { ActorGuard } from '../../common/guards/actor.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

import { UserRoleEnum } from '../../common/enum/user.enum.js';

import type { IAuthenticatedRequest } from '../../common/interface/auth-actor.interface.js';
import { CreateScheduleExceptionDto } from './dto/create-schedule-exception.dto.js';
import { UpdateScheduleExceptionDto } from './dto/update-schedule-exception.dto.js';

@Controller('schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @UseGuards(ActorGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  create(@Body() dto: CreateScheduleDto) {
    return this.scheduleService.create(dto);
  }

  @Get('me')
  @UseGuards(ActorGuard, RolesGuard)
  @Roles(UserRoleEnum.STAFF)
  getMySchedule(@Req() req: IAuthenticatedRequest) {
    return this.scheduleService.getMySchedule(String(req.user._id));
  }

  @Get('doctor/:doctorId')
  getDoctorSchedule(@Param('doctorId') doctorId: string) {
    return this.scheduleService.GetDoctorById(doctorId);
  }

  @Get('availability')
  getAvailability(@Query() dto: ScheduleAvailabilityDto) {
    return this.scheduleService.GetAvailability(dto);
  }

  @Patch(':id')
  @UseGuards(ActorGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    return this.scheduleService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(ActorGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  remove(@Param('id') id: string) {
    return this.scheduleService.remove(id);
  }

  @Post('exceptions')
  @UseGuards(ActorGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  createException(@Body() dto: CreateScheduleExceptionDto) {
    return this.scheduleService.createException(dto);
  }

  @Patch('exceptions/:id')
  @UseGuards(ActorGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  updateException(
    @Param('id') id: string,
    @Body() dto: UpdateScheduleExceptionDto,
  ) {
    return this.scheduleService.updateException(id, dto);
  }

  @Delete('exceptions/:id')
  @UseGuards(ActorGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  removeException(@Param('id') id: string) {
    return this.scheduleService.removeException(id);
  }
}
