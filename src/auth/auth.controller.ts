import { Controller, Post, Body, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UserId } from '../decorators/userId.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {
  }

  @HttpCode(HttpStatus.OK)
  @Post('signup')
  async signup(@Body() SignupDto: SignupDto) {
    return this.authService.signUp(SignupDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() LoginDto: LoginDto) {
    return this.authService.login(LoginDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout() {
    return this.authService.logout();
  }

  @HttpCode(HttpStatus.OK)
  @Get('profile')
  getProfile(@UserId() userId: string) {
    return this.authService.getProfile(userId);
  }
}
