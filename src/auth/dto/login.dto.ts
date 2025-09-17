import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  readonly email: string;

  @IsNotEmpty()
  @MinLength(6)
  @IsString()
  @Matches(/^(?=.*[0-9])/, {
    message: 'Password must contain at least one number',
  })
  readonly password: string;
}
