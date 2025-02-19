// auth.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './servicies/auth.service';
import { User, UserSchema } from './schema/user.schema';
import { JwtAuthService } from './servicies/jwtService.service';
import { UserService } from './servicies/userService.service';
import { JwtAuthGuard } from './guards/JwtAuthGuard.guard';
import { MailService } from './servicies/mailService.service'; // Import MailService
import { EmailVerificationService } from 'src/utils';
import { Algorithm } from 'jsonwebtoken'; // Add this import

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('jwt.secret');
        console.log('JWT Secret:', secret);
        
        const expiresIn = configService.get<string>('jwt.accessToken.expiresIn');
        console.log('JWT Expiration:', expiresIn);
        
        const algorithm = configService.get<string>('jwt.accessToken.algorithm');
        console.log('JWT Algorithm:', algorithm);
        
        return {
          secret,
          signOptions: {
            expiresIn,
            algorithm: algorithm as Algorithm,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthService,
    UserService,
    JwtAuthGuard,
    EmailVerificationService,
    MailService,
  ],
  exports: [AuthService, JwtAuthService, JwtAuthGuard],
})
export class AuthModule {}
