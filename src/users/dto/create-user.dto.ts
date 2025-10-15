import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserTypeEnum } from '../enums/user-type.enum';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @IsNotEmpty()
  @IsString()
  readonly email: string;

  @IsString()
  @IsOptional()
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

  @IsOptional()
  @IsBoolean()
  readonly isSuperAdmin?: boolean = false;

  @IsOptional()
  @Type(() => Date)
  readonly emailVerifiedAt?: Date;

  @IsOptional()
  @Type(() => Date)
  readonly phoneVerifiedAt?: Date;

  @IsOptional()
  @IsString()
  readonly avatar?: string;

  @IsNotEmpty()
  @IsEnum(UserTypeEnum)
  readonly type: UserTypeEnum = UserTypeEnum.USER;

  @IsOptional()
  @IsString()
  readonly address?: string;
}
