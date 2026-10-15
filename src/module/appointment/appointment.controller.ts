import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';
import { UpdateAppointmentStatusDto } from './dto/update-status-appomtment.dto.js';
import { UserRoleEnum } from '../../common/index.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { ActorGuard } from '../../common/guards/actor.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import type { IAuthenticatedRequest } from '../../common/interface/auth-actor.interface.js';

@Controller('appointment')
@UseGuards(ActorGuard, RolesGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post('create')
  @Roles(UserRoleEnum.USER)
  create(@Body() dto: CreateAppointmentDto, @Req() req: IAuthenticatedRequest) {
    return this.appointmentService.create_Appointment(dto, req.user._id);
  }

  @Get('my-appointments')
  @Roles(UserRoleEnum.USER)
  getMyAppointments(@Req() req: IAuthenticatedRequest) {
    return this.appointmentService.GetMyAppointment(req.user._id);
  }

  @Get('doctor-appointments/:doctorId')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.STAFF)
  getDoctorAppointments(
    @Param('doctorId') doctorId: string,
    @Req() req: IAuthenticatedRequest,
  ) {
    return this.appointmentService.GetDoctorAppointment(doctorId, req.user);
  }

  @Get(':id')
  @Roles(UserRoleEnum.USER, UserRoleEnum.STAFF, UserRoleEnum.ADMIN)
  findById(@Param('id') id: string, @Req() req: IAuthenticatedRequest) {
    return this.appointmentService.findById(id, req.user);
  }

  @Patch(':id')
  @Roles(UserRoleEnum.USER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
    @Req() req: IAuthenticatedRequest,
  ) {
    return this.appointmentService.updatedate(id, dto, req.user._id);
  }

  @Patch(':id/status')
  @Roles(UserRoleEnum.STAFF, UserRoleEnum.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
    @Req() req: IAuthenticatedRequest,
  ) {
    return this.appointmentService.updateState(id, req.user, dto);
  }

  @Patch(':id/cancel')
  @Roles(UserRoleEnum.USER, UserRoleEnum.STAFF, UserRoleEnum.ADMIN)
  cancel(@Param('id') id: string, @Req() req: IAuthenticatedRequest) {
    return this.appointmentService.cancel(id, req.user);
  }
}
