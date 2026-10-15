import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { UserRoleEnum } from '../enum/user.enum.js';
import type {
  IRoleTokenConfig,
  ISignTokenInput,
  ITokenPayload,
} from '../interface/token.interface.js';

const ROLE_CONFIG: Readonly<Record<UserRoleEnum, IRoleTokenConfig>> = {
  [UserRoleEnum.USER]: {
    accessSecretKey: 'USER_ACCESS_SIGNATURE',
    refreshSecretKey: 'USER_REFRESH_SIGNATURE',
    accessExpiresKey: 'JWT_EXPIRES_USER',
    refreshExpiresKey: 'JWT_EXPIRES_USER_refresh',
  },
  [UserRoleEnum.ADMIN]: {
    accessSecretKey: 'ADMIN_ACCESS_SIGNATURE',
    refreshSecretKey: 'ADMIN_REFRESH_SIGNATURE',
    accessExpiresKey: 'JWT_EXPIRES_ADMIN',
    refreshExpiresKey: 'JWT_EXPIRES_ADMIN_refresh',
  },
  [UserRoleEnum.STAFF]: {
    accessSecretKey: 'STAFF_ACCESS_SIGNATURE',
    refreshSecretKey: 'STAFF_REFRESH_SIGNATURE',
    accessExpiresKey: 'JWT_EXPIRES_STAFF',
    refreshExpiresKey: 'JWT_EXPIRES_STAFF_refresh',
  },
};

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private config(role: UserRoleEnum): IRoleTokenConfig {
    const cfg = ROLE_CONFIG[role];
    if (!cfg) throw new UnauthorizedException('Unsupported role');
    return cfg;
  }

  private sign(
    input: ISignTokenInput,
    secretKey: string,
    expiresKey: string,
  ): Promise<string> {
    const { userId, email, role } = input;
    return this.jwtService.signAsync(
      { sub: userId, email, role },
      {
        secret: this.configService.getOrThrow<string>(secretKey),
        expiresIn: this.configService.getOrThrow<string>(expiresKey) as never,
        jwtid: randomUUID(),
      },
    );
  }

  generateAccessToken(input: ISignTokenInput): Promise<string> {
    const cfg = this.config(input.role);
    return this.sign(input, cfg.accessSecretKey, cfg.accessExpiresKey);
  }

  generateRefreshToken(input: ISignTokenInput): Promise<string> {
    const cfg = this.config(input.role);
    return this.sign(input, cfg.refreshSecretKey, cfg.refreshExpiresKey);
  }

  async verifyAccessToken(
    token: string,
    role: UserRoleEnum,
  ): Promise<ITokenPayload> {
    try {
      return await this.jwtService.verifyAsync<ITokenPayload>(token, {
        secret: this.configService.getOrThrow<string>(
          this.config(role).accessSecretKey,
        ),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async verifyRefreshToken(
    token: string,
    role: UserRoleEnum,
  ): Promise<ITokenPayload> {
    try {
      return await this.jwtService.verifyAsync<ITokenPayload>(token, {
        secret: this.configService.getOrThrow<string>(
          this.config(role).refreshSecretKey,
        ),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  decodeToken(token: string): ITokenPayload | null {
    return this.jwtService.decode<ITokenPayload | null>(token);
  }
}
