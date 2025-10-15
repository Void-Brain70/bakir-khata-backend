import { BadRequestException, Injectable } from '@nestjs/common';
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

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
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
    const user = await this.userModel
      .findOne({ email: LoginDto.email })
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
