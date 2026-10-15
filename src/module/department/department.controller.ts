// modules/department/department.controller.ts
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
import { DepartmentService } from './department.service.js';
import { CreateDepartmentDto } from './dto/create-department.dto.js';
import { UpdateDepartmentDto } from './dto/update-department.dto.js';
import { imageUploadOptions } from '../../common/utils/multer/multer.js';
import { ActorGuard } from '../../common/guards/actor.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRoleEnum } from '../../common/enum/user.enum.js';
import type { IAuthenticatedRequest } from '../../common/interface/auth-actor.interface.js';
import type {
  IDepartmentListResponse,
  IDepartmentResponse,
} from '../../common/interface/Department.interface.js';
import type { Department } from '../../database/model/department.model.js';

@Controller('Department')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post('/create-Department')
  @UseGuards(ActorGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  create(
    @Body() dto: CreateDepartmentDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: IAuthenticatedRequest,
  ): Promise<Department> {
    return this.departmentService.create(dto, req.user._id, file);
  }

  @Patch('/update-Department/:id')
  @UseGuards(ActorGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Department> {
    return this.departmentService.update(id, dto, file);
  }

  @Delete('/delete-Department/:id')
  @UseGuards(ActorGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  remove(@Param('id') id: string): Promise<IDepartmentResponse> {
    return this.departmentService.remove(id);
  }

  @Get('/get-all')
  findAll(): Promise<IDepartmentListResponse> {
    return this.departmentService.findAll();
  }

  @Get('/get-Department/:id')
  findById(@Param('id') id: string): Promise<IDepartmentResponse> {
    return this.departmentService.findById(id);
  }
}
