import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto.js';
import { IsEmail, IsStrongPassword } from 'class-validator';

export class UpdatePasswordDto extends PartialType(CreateUserDto) {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsStrongPassword(
    {},
    {
      message:
        'Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol',
    },
  )
  newPassword: string;
  @IsStrongPassword(
    {},
    {
      message:
        'Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol',
    },
  )
  currentPassword: string;
}
