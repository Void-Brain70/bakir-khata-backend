import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { UserTypeEnum } from '../enums/user-type.enum';
import { Type } from 'class-transformer';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @ValidateIf((o: { password: string }) => o.password !== undefined)
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(UserTypeEnum)
  type?: UserTypeEnum;

  @IsOptional()
  @Type(() => Date)
  email_verified_at?: Date;

  @IsOptional()
  @Type(() => Date)
  phone_verified_at?: Date;

  // @IsOptional()
  // @IsArray()
  // @IsString({ each: true })
  // roles?: string[];
}
