import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { UserRoleEnum } from '../enum/user.enum.js';
import type { IAuthenticatedRequest } from '../interface/auth-actor.interface.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<
      UserRoleEnum[] | undefined
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!required?.length) return true;

    const { user } = context.switchToHttp().getRequest<IAuthenticatedRequest>();
    if (!required.includes(user.role)) {
      throw new ForbiddenException('You do not have permission');
    }
    return true;
  }
}
