import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  @Matches(/^(?:\+?88)?01[3-9]\d{8}$/, {
    message: 'Phone number must be a valid Bangladeshi phone number',
  })
  readonly phone?: string;

  @IsNotEmpty()
  @MinLength(6)
  @IsString()
  @Matches(/^(?=.*[0-9])/, {
    message: 'Password must contain at least one number',
  })
  readonly password: string;
}
