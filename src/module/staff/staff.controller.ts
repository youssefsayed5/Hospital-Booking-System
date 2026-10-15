// modules/staff/staff.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StaffService } from './staff.service.js';
import { CreateStaffDto } from './dto/create-staff.dto.js';
import { UpdateStaffDto } from './dto/update-staff.dto.js';
import { UpdateStaffPasswordDto } from './dto/password-update.dto.js';
import { ActorGuard } from '../../common/guards/actor.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRoleEnum } from '../../common/enum/user.enum.js';
import type { Staff } from '../../database/model/staff.model.js';
import type { IAuthenticatedRequest } from '../../common/interface/auth-actor.interface.js';
import type {
  IStaffCreateResponse,
  IStaffMessageResponse,
  IStaffRemoveResponse,
  IStaffUpdateResponse,
} from '../../common/interface/staff.interface.js';

@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post('create-staff')
  @UseGuards(ActorGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  create(@Body() dto: CreateStaffDto): Promise<IStaffCreateResponse> {
    return this.staffService.create(dto);
  }

  @Get('get-all')
  @UseGuards(ActorGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  findAll(): Promise<Staff[]> {
    return this.staffService.findAllStaff();
  }

  @Get('get-doctors')
  findDoctors(): Promise<Staff[]> {
    return this.staffService.findDoctor();
  }

  @Get('get-doctor/:id')
  findDoctorById(@Param('id') id: string): Promise<Staff> {
    return this.staffService.findDoctorById(id);
  }

  @Get('get-staff/:id')
  @UseGuards(ActorGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  findById(@Param('id') id: string): Promise<Staff> {
    return this.staffService.findStaffById(id);
  }


  @Patch('update-password')
  @UseGuards(ActorGuard, RolesGuard)
  @Roles(UserRoleEnum.STAFF)
  updatePassword(
    @Body() dto: UpdateStaffPasswordDto,
    @Req() req: IAuthenticatedRequest,
  ): Promise<IStaffMessageResponse> {
    return this.staffService.updatePassword(req.user._id, dto);
  }

  @Patch('update-staff/:id')
  @UseGuards(ActorGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
  ): Promise<IStaffUpdateResponse> {
    return this.staffService.updateData(id, dto);
  }

  @Delete('delete-staff/:id')
  @UseGuards(ActorGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  remove(@Param('id') id: string): Promise<IStaffRemoveResponse> {
    return this.staffService.remove(id);
  }
}
