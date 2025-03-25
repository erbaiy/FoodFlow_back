// src/modules/auth/helpers/auth.helpers.ts
import { HttpException, HttpStatus, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { UserDocument } from "../../modules/auth/schema/user.schema";
import { RegisterDto, LoginDto } from "../../modules/auth/dto/auth.dto";
import { Response } from 'express';

@Injectable()
export class AuthHelpers {
  /**
   * Parse duration string to milliseconds
   */
  static parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 900000; // 15 minutes default

    const [, value, unit] = match;
    const num = parseInt(value, 10);

    switch (unit) {
      case 's': return num * 1000;
      case 'm': return num * 60 * 1000;
      case 'h': return num * 60 * 60 * 1000;
      case 'd': return num * 24 * 60 * 60 * 1000;
      default: return 900000;
    }
  }

  /**
   * Set authentication cookies
   */
  static setAuthCookies(
    response: Response, 
    tokens: { accessToken: string; refreshToken: string },
    environment: string
  ): void {
    const secure = environment === 'production';
    
    // Set refresh token
    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      path: '/',
      maxAge: this.parseDuration('1d'), // 1 day
    });

    // Set access token
    response.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      path: '/',
      maxAge: this.parseDuration('1h'), // 1 hour or based on JWT config
    });
    
    // Set Authorization header
    response.setHeader('Authorization', `Bearer ${tokens.accessToken}`);
  }
  
  /**
   * Clear authentication cookies
   */
  static clearAuthCookies(response: Response): void {
    response.clearCookie('accessToken', {
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
    });
    
    response.clearCookie('refreshToken', {
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
    });
    
    response.removeHeader('Authorization');
  }

  /**
   * Handle authentication errors
   */
  static handleAuthError(logger: any, error: Error): never {
    logger.error(`Auth error: ${error.message}`, error.stack);
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException('An unexpected error occurred');
  }

  /**
   * Handle verification errors
   */
  static handleVerificationError(logger: any, error: Error): never {
    logger.error(`Verification error: ${error.message}`, error.stack);
    if (error.name === 'TokenExpiredError') {
      throw new HttpException(
        'Verification link has expired',
        HttpStatus.BAD_REQUEST,
      );
    }
    throw new HttpException(
      'Invalid verification link',
      HttpStatus.BAD_REQUEST,
    );
  }
}

// Export for easy importing
export default AuthHelpers;