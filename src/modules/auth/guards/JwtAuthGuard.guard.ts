import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export enum TokenLocation {
  QUERY = 'query',
  PARAMS = 'params',
  COOKIES = 'cookies',
  HEADERS = 'headers'
}

export const Token = (location: TokenLocation) => {
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('tokenLocation', location, descriptor.value);
    return descriptor;
  };
};

@Injectable()
export  class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const handler = context.getHandler();
    const tokenLocation = this.reflector.get<TokenLocation>('tokenLocation', handler);

    try {
      const token = this.extractToken(request, tokenLocation);
      if (!token) {
        throw new UnauthorizedException('Token not found');
      }

      const decoded = this.jwtService.verify(token);
      request['decoded'] = decoded;
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractToken(request: Request, location: TokenLocation): string | undefined {
    switch (location) {
      case TokenLocation.QUERY:
        return request.query.token as string;
      
      case TokenLocation.PARAMS:
        return request.params.token;
      
      case TokenLocation.COOKIES:
        return request.cookies?.refreshToken;
      
      case TokenLocation.HEADERS:
        const authHeader = request.headers.authorization;
        return authHeader ? authHeader.split(' ')[1] : undefined;
      
      default:
        return undefined;
    }
  }
}