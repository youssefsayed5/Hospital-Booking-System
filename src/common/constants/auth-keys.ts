export const LOGOUT_ALL_TTL_SECONDS = 24 * 60 * 60; 

export const blacklistKey = (jti: string): string => `bl:${jti}`;
export const refreshKey = (userId: string, jti: string): string =>
  `rt:${userId}:${jti}`;
export const refreshPattern = (userId: string): string => `rt:${userId}:*`;
export const logoutAllKey = (userId: string): string => `lo:${userId}`;
