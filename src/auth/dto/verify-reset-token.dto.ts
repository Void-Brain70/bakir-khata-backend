import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyResetTokenDto {
  @IsNotEmpty()
  @IsString()
  readonly resetToken: string;
}