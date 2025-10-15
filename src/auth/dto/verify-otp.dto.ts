import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsString()
  //length of 4 digits and only numbers
  @Matches(/^\d{4}$/, {
    message: 'OTP must be a 4-digit number',
  })
  readonly otp: string;
}
