import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TokenService } from '../services/token.service.js';
import { RedisRepo } from '../reposatery/redis.reposatery.js';
import { UserRoleEnum } from '../enum/user.enum.js';
import { blacklistKey, logoutAllKey } from '../constants/auth-keys.js';
import { Staff } from '../../database/model/staff.model.js';
import { User } from '../../database/model/user.model.js';
import type {
  IAuthActor,
  IAuthenticatedRequest,
} from '../interface/auth-actor.interface.js';
import type { ITokenPayload } from '../interface/token.interface.js';

@Injectable()
export class ActorGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly redisRepo: RedisRepo,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Staff.name) private readonly staffModel: Model<Staff>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<IAuthenticatedRequest>();
    const token = this.extractToken(request.headers.authorization);

    const unverified = this.tokenService.decodeToken(token);
    const claimedRole = unverified?.role;
    if (!claimedRole || !Object.values(UserRoleEnum).includes(claimedRole)) {
      throw new UnauthorizedException('Invalid token');
    }

    const payload = await this.tokenService.verifyAccessToken(
      token,
      claimedRole,
    );
    await this.assertNotRevoked(payload);

    request.user = await this.loadActor(payload.sub, claimedRole);
    request.auth = payload;
    return true;
  }

  private extractToken(authorization: string | undefined): string {
    if (!authorization) {
      throw new UnauthorizedException('Authorization header is missing');
    }
    const parts = authorization.trim().split(/\s+/);
    const token = parts.length > 1 ? parts[1] : parts[0];
    if (!token) throw new UnauthorizedException('Invalid authorization');
    return token;
  }

  private async assertNotRevoked(payload: ITokenPayload): Promise<void> {
    const blacklisted = await this.redisRepo.get(blacklistKey(payload.jti));
    if (blacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const cutoff = await this.redisRepo.get(logoutAllKey(payload.sub));
    if (cutoff && payload.iat < Number(cutoff)) {
      throw new UnauthorizedException('Session has been revoked');
    }
  }

  private async loadActor(
    sub: string,
    role: UserRoleEnum,
  ): Promise<IAuthActor> {
    if (role === UserRoleEnum.STAFF) {
      const staff = await this.staffModel.findOne({
        _id: sub,
        deletedAt: null,
      });
      if (!staff) throw new UnauthorizedException('Staff not found');
      return { _id: staff._id, role };
    }
    const user = await this.userModel.findById(sub);
    if (!user || user.role !== role || user.isBlocked || user.deletedAt) {
      throw new UnauthorizedException('User not found');
    }
    return { _id: user._id, role };
  }
}
