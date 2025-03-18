import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { User, UserSchema } from './schema/user.schema';
import { JwtAuthService } from './services/jwtService.service';
import { UserService } from './services/userService.service';
import { JwtAuthGuard } from '../../common/guards/JwtAuthGuard.guard';
import { MailService } from './services/mailService.service';
import { EmailVerificationService } from 'src/utils';
import { Algorithm } from 'jsonwebtoken';
import { RestaurationModule } from '../resto/resto.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.accessToken.expiresIn'),
          algorithm: configService.get<string>('jwt.accessToken.algorithm') as Algorithm,
        },
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => RestaurationModule) // Use forwardRef here
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
  exports: [AuthService, JwtAuthService, JwtAuthGuard, UserService,MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
})
export class AuthModule {}



// // auth.module.ts
// import { Module } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
// import { JwtModule } from '@nestjs/jwt';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { AuthController } from './auth.controller';
// import { AuthService } from './services/auth.service';
// import { User, UserSchema } from './schema/user.schema';
// import { JwtAuthService } from './services/jwtService.service';
// import { UserService } from './services/userService.service';
// import { JwtAuthGuard } from '../../common/guards/JwtAuthGuard.guard';
// import { MailService } from './services/mailService.service'; // Import MailService
// import { EmailVerificationService } from 'src/utils';
// import { Algorithm } from 'jsonwebtoken'; // Add this import
// import { RestaurantService } from '../resto/resto.service';
// import { RestaurationModule } from '../resto/resto.module';

// @Module({
//   imports: [
//     MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
//     JwtModule.registerAsync({
//       imports: [ConfigModule],
//       useFactory: async (configService: ConfigService) => {
//         const secret = configService.get<string>('jwt.secret');
//         console.log('JWT Secret:', secret);

//         const expiresIn = configService.get<string>(
//           'jwt.accessToken.expiresIn',
//         );
//         console.log('JWT Expiration:', expiresIn);

//         const algorithm = configService.get<string>(
//           'jwt.accessToken.algorithm',
//         );
//         console.log('JWT Algorithm:', algorithm);

//         return {
//           secret,
//           signOptions: {
//             expiresIn,
//             algorithm: algorithm as Algorithm,
//           },
//         };
//       },
//       inject: [ConfigService],
//     }),
//     RestaurationModule

//   ],
//   controllers: [AuthController],
//   providers: [
//     AuthService,
//     JwtAuthService,
//     UserService,
//     JwtAuthGuard,
//     EmailVerificationService,
//     MailService,
    
//   ],
//   exports: [AuthService, JwtAuthService, JwtAuthGuard,UserService],
// })
// export class AuthModule {}
