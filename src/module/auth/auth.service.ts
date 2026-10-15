// modules/auth/auth.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, type HydratedDocument } from 'mongoose';
import { CreateAuthDto } from './dto/create-auth.dto.js';
import { VerifyAuthDto } from './dto/verify-auth.dto.js';
import { ResendOtpDto } from './dto/resend-otp.dto.js';
import { LoginAuthDto } from './dto/login-auth.dto.js';
import { ForgetPasswordDto } from './dto/forget-auth.dto.js';
import { ResetPasswordAuthDto } from './dto/Reset_password-auth.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import type {
  ILoginResponse,
  IMessageResponse,
  ISignupResponse,
  ITokenPair,
  OtpPurpose,
} from '../../common/interface/auth.interfaces.js';
import { EmailService } from '../../common/email/email.service.js';
import { TokenService } from '../../common/services/token.service.js';
import { RedisRepo } from '../../common/reposatery/redis.reposatery.js';
import { otpGenerator } from '../../common/otp/otp.js';
import { compareWord, hashWord } from '../../common/security/HashWord.js';
import { encryptPhoneNumber } from '../../common/security/phoneCrypto.js';
import { UserRoleEnum } from '../../common/enum/user.enum.js';
import {
  blacklistKey,
  LOGOUT_ALL_TTL_SECONDS,
  logoutAllKey,
  refreshKey,
  refreshPattern,
} from '../../common/constants/auth-keys.js';
import type {
  ISignTokenInput,
  ITokenPayload,
} from '../../common/interface/token.interface.js';
import { User } from '../../database/model/user.model.js';
import { Staff } from '../../database/model/staff.model.js';

const OTP_TTL_SECONDS = 600;
const OTP_COOLDOWN_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Staff.name) private readonly staffModel: Model<Staff>,
    private readonly emailService: EmailService,
    private readonly tokens: TokenService,
    private readonly redisRepo: RedisRepo,
  ) {}

  // ---------- helpers ----------

  private otpKey(purpose: OtpPurpose, email: string): string {
    return `otp:${purpose}:${email}`;
  }

  private attemptsKey(purpose: OtpPurpose, email: string): string {
    return `otp:attempts:${purpose}:${email}`;
  }

  private cooldownKey(purpose: OtpPurpose, email: string): string {
    return `otp:cooldown:${purpose}:${email}`;
  }

  private async isOnCooldown(
    purpose: OtpPurpose,
    email: string,
  ): Promise<boolean> {
    return Boolean(await this.redisRepo.get(this.cooldownKey(purpose, email)));
  }

  private async sendOtp(
    purpose: OtpPurpose,
    email: string,
    name: string,
  ): Promise<void> {
    const otp = String(otpGenerator());
    const hashed = await hashWord(otp);

    await this.redisRepo.set(
      this.otpKey(purpose, email),
      String(hashed),
      OTP_TTL_SECONDS,
    );
    await this.redisRepo.del(this.attemptsKey(purpose, email));

    await this.emailService.sendEmail({
      to: email,
      subject: 'Email Confirmation',
      template: 'confirmation',
      context: { name, otp, expiresInMinutes: 10 },
    });

    await this.redisRepo.set(
      this.cooldownKey(purpose, email),
      '1',
      OTP_COOLDOWN_SECONDS,
    );
  }

  private async consumeOtp(
    purpose: OtpPurpose,
    email: string,
    otp: string,
  ): Promise<void> {
    const attemptsKey = this.attemptsKey(purpose, email);
    const otpKey = this.otpKey(purpose, email);

    const stored = await this.redisRepo.get(otpKey);
    if (!stored) {
      throw new BadRequestException('OTP is expired or not found');
    }

    const attempts = await this.redisRepo.incr(attemptsKey);
    if (attempts === 1) {
      await this.redisRepo.expire(attemptsKey, OTP_TTL_SECONDS);
    }
    if (attempts > OTP_MAX_ATTEMPTS) {
      throw new BadRequestException('Too many attempts, request a new OTP');
    }

    const isValid = await compareWord(otp, stored);
    if (!isValid) {
      throw new BadRequestException('OTP is invalid');
    }

    await this.redisRepo.del(otpKey);
    await this.redisRepo.del(attemptsKey);
  }

  private async issueTokens(input: ISignTokenInput): Promise<ITokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokens.generateAccessToken(input),
      this.tokens.generateRefreshToken(input),
    ]);

    const decoded = this.tokens.decodeToken(refreshToken);
    if (!decoded?.jti) {
      throw new InternalServerErrorException('Failed to issue tokens');
    }

    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await this.redisRepo.set(
        refreshKey(String(input.userId), decoded.jti),
        '1',
        ttl,
      );
    }

    return { accessToken, refreshToken };
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      (error as { code?: number }).code === 11000
    );
  }

  // ---------- signup / otp ----------

  async create(dto: CreateAuthDto): Promise<ISignupResponse> {
    const email = dto.email.toLowerCase();
    const { username } = dto;

    const existing = await this.userModel.findOne({
      $or: [{ email }, { username }],
    });
    if (existing) {
      throw new ConflictException(
        existing.email === email
          ? 'Email is already taken'
          : 'Username is already taken',
      );
    }

    const password = await hashWord(dto.password);
    const phone = dto.phoneNumber
      ? await encryptPhoneNumber(dto.phoneNumber)
      : undefined;

    let user: HydratedDocument<User>;
    try {
      user = await this.userModel.create({
        fname: dto.fname,
        lname: dto.lname,
        email,
        username,
        password,
        phone,
        age: dto.age,
        gender: dto.gender,
        profileImage: dto.profileImage,
        confirmEmail: false,
      });
    } catch (error: unknown) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Email or username already exists');
      }
      throw error;
    }

    await this.sendOtp('verify', email, username);

    return {
      message: 'Account created, check your email for the OTP',
      user: {
        _id: user._id,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        username: user.username,
      },
    };
  }

  async verify_otp(dto: VerifyAuthDto): Promise<IMessageResponse> {
    const email = dto.email.toLowerCase();

    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('Email is not found');
    if (user.confirmEmail) {
      throw new BadRequestException('Email is already confirmed');
    }

    await this.consumeOtp('verify', email, String(dto.otp));

    user.confirmEmail = true;
    await user.save();

    return { message: 'Email confirmed successfully' };
  }

  async resend_otp(dto: ResendOtpDto): Promise<IMessageResponse> {
    const email = dto.email.toLowerCase();

    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('Email is not found');
    if (user.confirmEmail) {
      throw new BadRequestException('Email is already confirmed');
    }

    if (await this.isOnCooldown('verify', email)) {
      throw new BadRequestException(
        'Please wait before requesting another OTP',
      );
    }

    await this.sendOtp('verify', email, user.username);
    return { message: 'OTP resent successfully' };
  }

  // ---------- login / tokens ----------

  async login(dto: LoginAuthDto): Promise<ILoginResponse> {
    const email = dto.email.toLowerCase();
const user = await this.userModel
  .findOne({
    email,
    deletedAt: null,
  })
  .select('+password');
    const passwordMatches = user
      ? await compareWord(dto.password, user.password)
      : false;

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.isBlocked) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.confirmEmail) {
      throw new BadRequestException('Confirm your email first');
    }
    if (!user.role) {
      throw new BadRequestException('User role is not assigned');
    }

    const pair = await this.issueTokens({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    return { message: 'login successfully', ...pair };
  }

  async staffLogin(dto: LoginAuthDto): Promise<ILoginResponse> {
    const email = dto.email.toLowerCase();

    const staff = await this.staffModel
      .findOne({ email, deletedAt: null })
      .select('+password');
    const passwordMatches = staff
      ? await compareWord(dto.password, staff.password)
      : false;

    if (!staff || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const pair = await this.issueTokens({
      userId: staff._id,
      email: staff.email,
      role: UserRoleEnum.STAFF,
    });

    return { message: 'login successfully', ...pair };
  }

  async refresh(dto: RefreshTokenDto): Promise<ITokenPair> {
    const claimedRole = this.tokens.decodeToken(dto.refreshToken)?.role;
    if (!claimedRole || !Object.values(UserRoleEnum).includes(claimedRole)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload = await this.tokens.verifyRefreshToken(
      dto.refreshToken,
      claimedRole,
    );

    const key = refreshKey(payload.sub, payload.jti);
    const active = await this.redisRepo.getAndDelete(key);
    if (!active) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    return this.issueTokens({
      userId: new Types.ObjectId(payload.sub),
      email: payload.email,
      role: claimedRole,
    });
  }

  async logout(
    auth: ITokenPayload,
    refreshToken?: string,
  ): Promise<IMessageResponse> {
    const ttl = auth.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await this.redisRepo.set(blacklistKey(auth.jti), '1', ttl);
    }

    if (refreshToken) {
      const refresh = this.tokens.decodeToken(refreshToken);
      if (refresh?.jti && refresh.sub === auth.sub) {
        await this.redisRepo.del(refreshKey(auth.sub, refresh.jti));
      }
    }

    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string): Promise<IMessageResponse> {
    await this.redisRepo.delByPattern(refreshPattern(userId));
    await this.redisRepo.set(
      logoutAllKey(userId),
      String(Math.floor(Date.now() / 1000) + 1),
      LOGOUT_ALL_TTL_SECONDS,
    );
    return { message: 'Logged out from all devices' };
  }

  // ---------- password reset ----------

  async forget_password(dto: ForgetPasswordDto): Promise<IMessageResponse> {
    const email = dto.email.toLowerCase();
    const response: IMessageResponse = {
      message: 'If the email exists, an OTP has been sent',
    };

    const user = await this.userModel.findOne({ email });
    if (!user || !user.confirmEmail) return response;
    if (await this.isOnCooldown('reset', email)) return response;

    await this.sendOtp('reset', email, user.username);
    return response;
  }

  async Reset_password(dto: ResetPasswordAuthDto): Promise<IMessageResponse> {
    const email = dto.email.toLowerCase();

    const user = await this.userModel.findOne({ email });
    if (!user || !user.confirmEmail) {
      throw new BadRequestException('OTP is invalid or expired');
    }

    await this.consumeOtp('reset', email, String(dto.otp));

    user.password = await hashWord(dto.password);
    await user.save();

    await this.logoutAll(String(user._id));

    return { message: 'Password is reset successfully' };
  }
}
