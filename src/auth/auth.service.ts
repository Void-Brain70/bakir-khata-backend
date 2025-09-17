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

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(signupDto: SignupDto) {
    const user = await this.userModel.findOne({
      $or: [{ email: signupDto.email }, { phone: signupDto.phone }],
    });
    if (user) {
      throw new BadRequestException('User already exists');
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
      .populate('roles');
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
    const user = await this.userModel.findById(userId).populate('roles');
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return this.formatUserData(user);
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
