import { randomInt } from 'node:crypto';

export const otpGenerator = (length: number = 6): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits.charAt(randomInt(digits.length));
  }
  return otp;
};
