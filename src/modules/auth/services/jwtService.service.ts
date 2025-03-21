import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate a JWT token based on type
   * @param payload The data to encode in the token
   * @param type The type of token to generate (access, refresh, verification, reset)
   */
  generateToken(payload: any, type: 'access' | 'refresh' | 'verification' | 'reset'): string {
    const config = this.configService.get(`jwt.${type}Token`);
    
    if (!config) {
      throw new Error(`Invalid token type: ${type}`);
    }
    
    return this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.secret'),
      expiresIn: config.expiresIn,
      algorithm: config.algorithm || 'HS256',
    });
  }

  /**
   * Verify a JWT token
   * @param token The token to verify
   * @param type Optional token type for specific verification
   */
  async verifyToken(token: string, type?: 'access' | 'refresh' | 'verification' | 'reset'): Promise<any> {
    try {
      const algorithms = type 
        ? [this.configService.get(`jwt.${type}Token.algorithm`) || 'HS256']
        : ['HS256'];
      
      return await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('jwt.secret'),
        algorithms,
      });
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Decode a JWT token without verifying it
   * @param token The token to decode
   */
  decodeToken(token: string): any {
    return this.jwtService.decode(token);
  }
}









// // jwtService.service.ts
// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { JwtService } from '@nestjs/jwt';

// @Injectable()
// export class JwtAuthService {
//   constructor(
//     private readonly jwtService: JwtService,
//     private readonly configService: ConfigService,
//   ) {}

//   generateToken(payload: any, type: 'access' | 'refresh' | 'verification' | 'reset') {
//     const expiresIn = this.configService.get<string>(`jwt.${type}Token.expiresIn`);
//     return this.jwtService.sign(payload, { expiresIn });
//   }
// }