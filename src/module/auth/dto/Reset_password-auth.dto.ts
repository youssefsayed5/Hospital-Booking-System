import {
  IsEmail,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class ResetPasswordAuthDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString({ message: 'OTP must be a string' })
  otp:string

  @IsStrongPassword()
  password:string;


}
