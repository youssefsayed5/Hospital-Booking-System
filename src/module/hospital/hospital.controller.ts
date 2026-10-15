// modules/hospital/hospital.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { HospitalService } from './hospital.service.js';
import { CreateHospitalDto } from './dto/create-hospital.dto.js';
import { UpdateHospitalDto } from './dto/update-hospital.dto.js';
import { imageUploadOptions } from '../../common/utils/multer/multer.js';
import { ActorGuard } from '../../common/guards/actor.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRoleEnum } from '../../common/enum/user.enum.js';
import type { IAuthenticatedRequest } from '../../common/interface/auth-actor.interface.js';
import type {
  IHospitalListResponse,
  IHospitalResponse,
} from '../../common/interface/hospital.interface.js';
import type { Hospital } from '../../database/model/hospital.model.js';

@Controller('hospital')
export class HospitalController {
  constructor(private readonly hospitalService: HospitalService) {}

  @Post('create-hospital')
  @UseGuards(ActorGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  create(
    @Body() dto: CreateHospitalDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: IAuthenticatedRequest,
  ): Promise<Hospital> {
    return this.hospitalService.create(dto, req.user._id, file);
  }

  @Patch('update-hospital/:id')
  @UseGuards(ActorGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHospitalDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<IHospitalResponse> {
    return this.hospitalService.update(id, dto, file);
  }

  @Delete('delete-hospital/:id')
  @UseGuards(ActorGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  remove(@Param('id') id: string): Promise<IHospitalResponse> {
    return this.hospitalService.remove(id);
  }

  @Get('get-all')
  findAll(): Promise<IHospitalListResponse> {
    return this.hospitalService.findAll();
  }

  @Get('get-hospital/:id')
  findById(@Param('id') id: string): Promise<IHospitalResponse> {
    return this.hospitalService.findById(id);
  }
}
