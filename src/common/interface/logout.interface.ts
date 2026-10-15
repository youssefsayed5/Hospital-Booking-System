import { UserRoleEnum } from "../enum/user.enum.js";

export interface JwtPayload {
  sub: string;
  role:UserRoleEnum;
  jti: string;
  exp: number;
}

export interface LogoutDto {
  refreshToken?: string; 
}
