// modules/auth/auth.controller.ts
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { CreateAuthDto } from './dto/create-auth.dto.js';
import { ResendOtpDto } from './dto/resend-otp.dto.js';
import { VerifyAuthDto } from './dto/verify-auth.dto.js';
import { LoginAuthDto } from './dto/login-auth.dto.js';
import { ForgetPasswordDto } from './dto/forget-auth.dto.js';
import { ResetPasswordAuthDto } from './dto/Reset_password-auth.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { LogoutDto } from './dto/logout.dto.js';
import { ActorGuard } from '../../common/guards/actor.guard.js';
import type { IAuthenticatedRequest } from '../../common/interface/auth-actor.interface.js';
import type {
  ILoginResponse,
  IMessageResponse,
  ISignupResponse,
  ITokenPair,
} from '../../common/interface/auth.interfaces.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signUp(@Body() dto: CreateAuthDto): Promise<ISignupResponse> {
    return this.authService.create(dto);
  }

  @Post('verify')
  verify(@Body() dto: VerifyAuthDto): Promise<IMessageResponse> {
    return this.authService.verify_otp(dto);
  }

  @Post('resend-otp')
  resendOtp(@Body() dto: ResendOtpDto): Promise<IMessageResponse> {
    return this.authService.resend_otp(dto);
  }

  @Post('login')
  login(@Body() dto: LoginAuthDto): Promise<ILoginResponse> {
    return this.authService.login(dto);
  }

  @Post('staff/login')
  staffLogin(@Body() dto: LoginAuthDto): Promise<ILoginResponse> {
    return this.authService.staffLogin(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto): Promise<ITokenPair> {
    return this.authService.refresh(dto);
  }

  @Post('forget-password')
  forgetPassword(@Body() dto: ForgetPasswordDto): Promise<IMessageResponse> {
    return this.authService.forget_password(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordAuthDto): Promise<IMessageResponse> {
    return this.authService.Reset_password(dto);
  }

  @Post('logout')
  @UseGuards(ActorGuard)
  logout(
    @Req() req: IAuthenticatedRequest,
    @Body() dto: LogoutDto,
  ): Promise<IMessageResponse> {
    return this.authService.logout(req.auth, dto.refreshToken);
  }

  @Post('logout-all')
  @UseGuards(ActorGuard)
  logoutAll(@Req() req: IAuthenticatedRequest): Promise<IMessageResponse> {
    return this.authService.logoutAll(String(req.user._id));
  }
}
