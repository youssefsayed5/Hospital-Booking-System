// modules/user/user.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service.js';
import { ActorGuard } from '../../common/guards/actor.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRoleEnum } from '../../common/enum/user.enum.js';
import type { IAuthenticatedRequest } from '../../common/interface/auth-actor.interface.js';
import type { IProfileResponse } from '../../common/interface/user-get.interface.js';

@Controller('user')
@UseGuards(ActorGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @Roles(UserRoleEnum.USER, UserRoleEnum.ADMIN)
  getProfile(@Req() req: IAuthenticatedRequest): Promise<IProfileResponse> {
    return this.userService.getProfile(req.user._id);
  }
}
