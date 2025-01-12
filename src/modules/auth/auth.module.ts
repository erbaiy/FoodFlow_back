// auth.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, UserSchema } from './schema/user.schema';
import { JwtAuthService } from './jwtService.service';
import { UserService } from './userService.service';
import { JwtAuthGuard } from './guards/JwtAuthGuard.guard';
import { MailService } from './mailService.service'; // Import MailService
import { EmailVerificationService } from 'src/utils';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: '1h' },
      }),
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
    MailService, // Add MailService here
  ],
  exports: [AuthService, JwtAuthService, JwtAuthGuard],
})
export class AuthModule {}