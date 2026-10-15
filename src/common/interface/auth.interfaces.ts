
import type { Types } from 'mongoose';

export type OtpPurpose = 'verify' | 'reset';

export interface IMessageResponse {
  message: string;
}

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ILoginResponse extends ITokenPair {
  message: string;
}

export interface ISafeUser {
  _id: Types.ObjectId;
  fname: string;
  lname: string;
  email: string;
  username: string;
}

export interface ISignupResponse {
  message: string;
  user: ISafeUser;
}
