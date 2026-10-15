import type { Request } from 'express';
import type { Types } from 'mongoose';
import { UserRoleEnum } from '../enum/user.enum.js';
import type { ITokenPayload } from './token.interface.js';

export interface IAuthActor {
  _id: Types.ObjectId;
  role: UserRoleEnum;
}

export interface IAuthenticatedRequest extends Request {
  user: IAuthActor;
  auth: ITokenPayload;
}
