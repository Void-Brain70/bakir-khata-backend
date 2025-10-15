import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { User } from '../users/entities/user.entity';
import { HydratedDocument, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import configuration from '../config/configuration';
import { UserResponseDto } from './dto/auth-user-response.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { generateOTP, setRandomNumber } from '../utils/helper';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetToken } from './entities/reset-token.schema';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(ResetToken.name) private resetTokenModel: Model<ResetToken>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(signupDto: SignupDto) {
    const existingEmail = await this.userModel.findOne({
      email: signupDto.email,
    });
    if (existingEmail) {
      throw new BadRequestException('Email already exists');
    }

    const existingPhone = await this.userModel.findOne({
      phone: signupDto.phone,
    });
    if (existingPhone) {
      throw new BadRequestException('Phone already exists');
    }

    const hashedPassword = await bcrypt.hash(signupDto.password, 10);
    const newUser = new this.userModel({
      ...signupDto,
      password: hashedPassword,
    });
    await newUser.save();
    const token = this.generateToken(newUser._id?.toString());
    return {
      message: 'User created successfully',
      token,
      user: this.formatUserData(newUser),
    };
  }

  async login(LoginDto: LoginDto) {
    const user = await this.userModel.findOne({ email: LoginDto.email });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const isMatch = await bcrypt.compare(LoginDto.password, user.password);
    if (!isMatch) {
      throw new BadRequestException('Invalid credentials');
    }
    const token = this.generateToken(user._id?.toString());
    return {
      message: 'Login successful',
      token,
      user: this.formatUserData(user),
    };
  }

  logout() {
    return { message: 'Logout successful' };
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return this.formatUserData(user);
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const { avatar, ...rest } = updateProfileDto;
    Object.assign(user, rest);
    if (avatar !== undefined) {
      user.avatar = avatar;
    }
    await user.save();
    return this.formatUserData(user);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const isMatch = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.password,
    );
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await this.userModel.updateOne(
      { _id: userId },
      { password: hashedPassword },
    );
    return { message: 'Password changed successfully' };
  }

  async resendOTP(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.emailVerifiedAt) {
      throw new BadRequestException('User already verified');
    }
    //check if the otp is already cached
    const cachedOtp = (await this.cacheManager.get(`otp:${user.email}`)) as {
      otp: string;
      validTill: Date;
    } | null;
    console.log(`Cached OTP for ${user.email} Resend OTP Method :`, cachedOtp);
    if (cachedOtp && new Date(cachedOtp.validTill) > new Date()) {
      return {
        status: 'success',
        message: 'OTP resent successfully',
        validTill: cachedOtp.validTill,
      };
    } else {
      const otp = generateOTP() as { otp: string; validTill: Date };
      await this.cacheManager.set(`otp:${user.email}`, otp, 3 * 60 * 1000);
      console.log('Generated OTP for Resend OTP Method :', otp);
      // await this.authEmailQueue.add('send-otp-email', {
      //   email: user.email,
      //   otp: otp,
      // });
      return {
        status: 'success',
        message: 'OTP sent successfully',
        validTill: otp.validTill,
      };
    }
  }

  async verifyOTP(userId: string, verifyOtpDto: VerifyOtpDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    //check if the user is already verified
    if (user.emailVerifiedAt) {
      throw new BadRequestException('User already verified');
    }
    //get the otp from cache
    const cachedOtp = (await this.cacheManager.get(`otp:${user.email}`)) as {
      otp: string;
      validTill: Date;
    } | null;
    console.log(`Cached OTP for ${user.email} Verify OTP Method :`, cachedOtp);
    if (!cachedOtp) {
      throw new BadRequestException('OTP expired. Please request a new one.');
    }
    if (cachedOtp.otp !== verifyOtpDto.otp) {
      throw new BadRequestException('Invalid OTP');
    }
    user.emailVerifiedAt = new Date();
    await user.save();
    await this.cacheManager.del(`otp:${user.email}`);
    return {
      status: 'success',
      message: 'OTP verified successfully',
      user: { ...user.toObject(), password: undefined },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userModel.findOne({
      email: forgotPasswordDto.email,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const resetToken = setRandomNumber(64);
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1); // Token valid for 1 hour
    //delete any existing reset token for the user
    await this.resetTokenModel.deleteMany({ user: user._id });
    await this.resetTokenModel.create({
      token: resetToken,
      user: user._id,
      expiryDate: expiryDate,
    });
    // Add the reset token to a queue for sending email
    // await this.authEmailQueue.add('send-reset-email', {
    //   email: forgotPasswordDto.email,
    //   resetToken: resetToken,
    // });
    console.log(
      `Password reset link for ${forgotPasswordDto.email}: Reset Token ${resetToken}`,
    );
    console.log();

    return { message: 'Password reset link sent to your email' };
  }

  async verifyResetToken(resetToken: string) {
    const token = await this.resetTokenModel.findOne({
      token: resetToken,
      expiryDate: { $gt: new Date() },
    });
    if (!token) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    return {
      status: 'success',
      message: 'Reset token is valid',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const resetToken = await this.resetTokenModel.findOne({
      token: resetPasswordDto.resetToken,
      expiryDate: { $gt: new Date() }, // Check if token is not expired
    });
    if (!resetToken) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const user = await this.userModel.findById(resetToken.user);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
    await this.userModel.updateOne(
      { _id: user._id },
      { password: hashedPassword },
    );
    await this.resetTokenModel.deleteOne({ _id: resetToken._id });

    return { message: 'Password reset successfully' };
  }

  generateToken(userId: string | unknown) {
    return this.jwtService.sign(
      { userId },
      { expiresIn: configuration().jwt.expiresIn },
    );
  }

  private formatUserData(userDoc: HydratedDocument<User>): UserResponseDto {
    const obj = userDoc.toObject() as User & {
      createdAt?: Date;
      updatedAt?: Date;
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, createdAt, updatedAt, ...rest } = obj;
    return rest as UserResponseDto;
  }
}
