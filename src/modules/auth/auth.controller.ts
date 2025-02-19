import { Controller, Post, Body, Get, Query, HttpStatus, UseGuards, ValidationPipe } from '@nestjs/common';

import { ApiTags, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthService } from './servicies/auth.service';
import { LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/JwtAuthGuard.guard';
import { ConfigService } from '@nestjs/config';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService

  ) {}

  @Post('register')
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User successfully registered' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async register(@Body(ValidationPipe) registerData: any) {
    const result = await this.authService.registerClient(registerData);
    return {
      statusCode: result.status,
      ...result.data,
    };
  }

  @Post('login')
  @ApiResponse({ status: HttpStatus.OK, description: 'User successfully logged in' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async login(@Body(ValidationPipe) credentials: LoginDto) {
    const result = await this.authService.login(credentials);
    return {
      statusCode: result.status,
      ...result.data,
    };
  }
 
  @Get('verify-email')
  @ApiQuery({ name: 'token', required: true, description: 'Email verification token' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Email successfully verified' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid token' })
  async verifyEmail(@Query('token') token: string) {
    return await this.authService.verifyEmail(token);
  }

  @Post('forgot-password')
  @ApiResponse({ status: HttpStatus.OK, description: 'Password reset email sent' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async forgotPassword(@Body('email') email: string) {
    return await this.authService.forgetPassword(email);
  }

  @Post('reset-password')
@ApiResponse({ status: HttpStatus.OK, description: 'Password successfully reset' })
@ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid token or new password' })
@ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
async resetPassword(@Body('token') token: string, @Body('newPassword') newPassword: string) {    
  return await this.authService.resetPassword(token, newPassword);
}

  @Get('test')
  @UseGuards(JwtAuthGuard)
  async test() {
    return 'hello youness ';
  }
}