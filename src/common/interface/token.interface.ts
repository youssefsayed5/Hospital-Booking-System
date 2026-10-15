import type { Types } from 'mongoose';
import { UserRoleEnum } from '../enum/user.enum.js';

export interface ISignTokenInput {
  userId: Types.ObjectId;
  email: string;
  role: UserRoleEnum;
}

export interface ITokenPayload {
  sub: string;
  email: string;
  role: UserRoleEnum;
  jti: string;
  iat: number;
  exp: number;
}

export interface IRoleTokenConfig {
  accessSecretKey: string;
  refreshSecretKey: string;
  accessExpiresKey: string;
  refreshExpiresKey: string;
}
