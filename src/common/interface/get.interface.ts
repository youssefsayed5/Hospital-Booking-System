import { UserRoleEnum } from "../enum/user.enum.js";

export interface UserListItem {
  _id: string;
  username: string;
  email: string;
  role: UserRoleEnum;
  confirmEmail: boolean;
  createdAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}

export interface GetAllUserQuery {
  page?: number; 
  limit?: number; 
}
