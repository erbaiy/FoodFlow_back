import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { J } from 'vitest/dist/chunks/reporters.C4ZHgdxQ';
import { JwtAuthGuard } from './guards/JwtAuthGuard.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  registerClient(@Body() registerDto: RegisterDto) {
    return this.authService.registerClient(registerDto);
  }


  // @UseGuards(JwtAuthGuard)
  @Post('verify-email')
  async verifyEmail(@Body('token') token: string) {
    try {
      const result = await this.authService.verifyEmail(token);
      return result;
    } catch (error) {
      return {
        statusCode: error.getStatus(),
        message: error.message,
      };
    }
  }
  // @Post('login')
  // login(@Body() loginDto: LoginDto) {
  //   return this.authService.login(loginDto);
  // }

  // Example of protected route with role-based access
//   @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('super_admin')
  // @Post('admin-only')
  // adminOnly() {
  //   return { message: 'Admin only route' };
  // }
}