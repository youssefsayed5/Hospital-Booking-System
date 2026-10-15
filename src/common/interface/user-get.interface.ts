import type { Types } from 'mongoose';

export interface IProfile {
  _id: Types.ObjectId;
  fname: string;
  lname: string;
  email: string;
  username: string;
  role: string;
  profileImage?: string;
  confirmEmail: boolean;
}

export interface IProfileResponse {
  message: string;
  results: IProfile;
}
