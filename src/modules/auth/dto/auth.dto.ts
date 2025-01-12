// src/auth/dto/auth.dto.ts
import { IsString, IsEmail, MinLength, Matches, IsEnum, IsPhoneNumber, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number'
  })
  password: string;
  @IsOptional()
  _id: string;

  // @IsEnum(['client', 'livreur', 'gestionnaire', 'super_admin'])
  // role: string;

  @IsString()
  address: string;

  @IsPhoneNumber()
  phoneNumber: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  fingerprint: string;

  @IsString()
  location: string;
}