// import { Injectable } from '@nestjs/common';
// import { Response, Request } from 'express';
// import { join } from 'path';
// import { UserService } from './userService.service';
// import { MailService } from './mailService.service';
// import { EmailVerificationService } from 'src/utils/mail/mail.service';

// import { User } from './user.interface'; // Import the User interface

// @Injectable()
// export class AuthService {
//     constructor(
//         private readonly userService: UserService,
//         private readonly emailVerificationService: EmailVerificationService,
//         // private readonly restaurantService: RestaurantService,
//         // private readonly securityManagerService: SecurityManagerService,
//         // private readonly otpMailService: OtpMailService,
//         // private readonly authTokensService: AuthTokensService,
//         // private readonly redisService: RedisService,
//         // private readonly jwtService: JwtService,
//         private readonly mailService: MailService
//     ) {}

//     async registerClient(body: any) {
//       try {
//           const registered = await this.userService.registerUser(body, 'client');

//           console.log("user id",registered);
//           if (!registered.success) {
//               return {
//                   status: 400,
//                   data: { message: registered.error }
//               };
//           }

//           const emailSent = await this.emailVerificationService.sendEmailVerification(
//             registered.user?._id.toString(), // Ensure _id is treated as a string
//             registered.user?.email
//           );

//           if (!emailSent) {
//               return {
//                   status: 500,
//                   data: { error: 'Failed to send verification email' }
//               };
//           }

//           return {
//               status: 201,
//               data: { message: 'User created successfully. Check your email for verification' }
//           };
//       } catch (error) {
//           return {
//               status: 500,
//               data: { error: error.message }
//           };
//       }
//   }
//     // async registerRestaurant(body: any, files: any) {
//     //     try {
//     //         const manageRegistered = await this.userService.registerUser(body, 'gestionnaire');
//     //         if (!manageRegistered.success) return {status: 400, data: {message: manageRegistered.error}};

//     //         const restaurantRegistered = await this.restaurantService.create({
//     //             ...body,
//     //             banner: files.banner ? files.banner[0].path : '',
//     //             logo: files.logo ? files.logo[0].path : ''
//     //         }, manageRegistered.user._id);
//     //         if (!restaurantRegistered.success) return {status: 400, data: {message: restaurantRegistered.error}};

//     //         const isSent = await this.emailVerificationService.send(manageRegistered.user._id, manageRegistered.user.email);
//     //         if (isSent.error) return {status: 500, data: {error: isSent.error}};

//     //         return {status: 201, data: { message: 'User and restaurant created successfully. Check your email for verification' }};
//     //     } catch (error) {
//     //         return {status: 500, data: {error: error.message}};
//     //     }
//     // }

//     // async sendEmailVerification(body: any) {
//     //     try {
//     //         const user = await this.userService.findOne({email: body.email});
//     //         if (!user) return {status: 404, data: {message: 'User not found'}};
//     //         const emailSent = await this.emailVerificationService.send(user._id, user.email);
//     //         if (emailSent.error) return {status: 500, data: {message: emailSent.error}};
//     //         return {status: 200, data: {message: 'Email verification sent successfully'}};
//     //     } catch (error) {
//     //         return {status: 500, data: {error: error.message}};
//     //     }
//     // }

//     // async verifyEmail(decoded: any) {
//     //     try {
//     //         const user = await this.userService.findByIdAndUpdate(decoded.id, {isVerified: true});
//     //         if (!user) return {status: 404, data: {message: 'User not found'}};
//     //         return {status: 200, data: {message: 'Email verified successfully'}};
//     //     } catch (error) {
//     //         return {status: 500, data: {error: error.message}};
//     //     }
//     // }

//     // async login(body: any, req: Request) {
//     //     try {
//     //         if (!body.email || !body.password)
//     //             return {status: 400, data: {message: 'Email and password are required'}};

//     //         const user = await this.userService.findOne({email: body.email});
//     //         if (!user) return {status: 404, data: {message: 'email not found'}};

//     //         const validPassword = await user.comparePassword(body.password);
//     //         if (!validPassword) return {status: 400, data: {message: 'Invalid password'}};

//     //         if (!user.isVerified) {
//     //             const emailSent = await this.emailVerificationService.send(user._id, user.email);
//     //             if (emailSent.error) return {status: 500, data: {error: emailSent.error}};
//     //             return {status: 401, data: {message: 'Email not verified. Check your email for verification'}};
//     //         }

//     //         if (await this.securityManagerService.isNewDeviceOrLocation(user.id, req)) {
//     //             const otpSent = await this.otpMailService.send(user);
//     //             if (otpSent.error) return {status: 500, data: {error: otpSent.error}};
//     //             return {status: 401, data: {message: 'New device or location detected. Check your email for OTP verification', errorCode: 'OTP_REQUIRED'}};
//     //         }

//     //         return {status: 200, data: await this.authTokensService.generateTokens(user)};
//     //     } catch (error) {
//     //         return {status: 500, data: {error: error.message}};
//     //     }
//     // }

//     // async sendOtp(body: any) {
//     //     try {
//     //         const user = await this.userService.findOne({email: body.email});
//     //         if (!user) return {status: 404, data: {message: 'User not found'}};
//     //         const otpSent = await this.otpMailService.send(user);
//     //         if (otpSent.error) return {status: 500, data: {error: otpSent.error}};
//     //         return {status: 200, data: {message: 'OTP sent successfully'}};
//     //     } catch (error) {
//     //         return {status: 500, data: {error: error.message}};
//     //     }
//     // }

//     // async verifyOtp(body: any, req: Request) {
//     //     try {
//     //         const userId = await this.redisService.get(body.otp);
//     //         if (!userId) return {status: 400, data: {error: 'Invalid or expired OTP'}};
//     //         const user = await this.userService.findById(userId);
//     //         await this.redisService.del(body.otp);
//     //         await this.securityManagerService.updateLoginHistory(userId, req);
//     //         return {status: 200, data: await this.authTokensService.generateTokens(user)};
//     //     } catch (error) {
//     //         return {status: 500, data: {error: error.message}};
//     //     }
//     // }

//     // async refreshToken(decoded: any) {
//     //     try {
//     //         const accessToken = this.jwtService.generateToken(decoded.id, 30 * 60);
//     //         return {status: 200, data: {accessToken}};
//     //     } catch (error) {
//     //         return {status: 500, data: {error: error.message}};
//     //     }
//     // }

//     // async logout() {
//     //     try {
//     //         return {status: 200, data: {message: 'Logout successful'}};
//     //     } catch (error) {
//     //         return {status: 500, data: {error: error.message}};
//     //     }
//     // }

//     // async forgotPassword(body: any) {
//     //     try {
//     //         const user = await this.userService.findOne({email: body.email});
//     //         if (!user) return {status: 404, data: {message: 'User not found'}};

//     //         const token = this.jwtService.generateToken(user._id, 600);
//     //         const emailSent = await this.mailService.send(
//     //             user.email,
//     //             'Reset Password',
//     //             join(__dirname, '../views/mail/reset-password.ejs'),
//     //             {link: `${process.env.FRONT_APP_HOST}/reset-password?token=${token}`}
//     //         );
//     //         if (emailSent.error) return {status: 500, data: {error: emailSent.error}};
//     //         return {status: 200, data: {message: 'Password reset email sent successfully'}};
//     //     } catch (error) {
//     //         return {status: 500, data: {error: error.message}};
//     //     }
//     // }
// }
// auth.service.ts
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { UserService } from './userService.service';

import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/user.schema';
import { EmailVerificationService } from 'src/utils';
import { MailService } from './mailService.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name); // Initialize the logger

  constructor(
    private readonly userService: UserService,
    private readonly emailVerificationService: EmailVerificationService, // Inject the service
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async registerClient(body: any) {
    try {
      const registered = await this.userService.registerUser(body, 'client');

      if (!registered.success) {
        return {
          status: HttpStatus.BAD_REQUEST,
          data: { message: registered.error },
        };
      }

      const emailSent =
        await this.emailVerificationService.sendEmailVerification(
          registered.user?._id.toString(),
          registered.user?.email,
        );

      if (!emailSent) {
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          data: { error: 'Failed to send verification email' },
        };
      }

      return {
        status: HttpStatus.CREATED,
        data: {
          message:
            'User created successfully. Check your email for verification',
        },
      };
    } catch (error) {
      this.logger.error(
        `Error in registerClient: ${error.message}`,
        error.stack,
      );
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: { error: error.message },
      };
    }
  }

  async verifyEmail(
    token: string,
  ): Promise<{ message: string; statusCode: number }> {
    if (!token) {
      throw new HttpException('No token provided', HttpStatus.BAD_REQUEST);
    }

    try {
      const decoded = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      this.logger.log(`Decoded token: ${JSON.stringify(decoded)}`);

      const user = await this.userModel.findById(decoded.id); // Ensure the key matches the payload
      if (!user) {
        throw new HttpException('Invalid token: User not found', HttpStatus.BAD_REQUEST);
      }

      if (user.isVerified) {
        throw new HttpException('Email already verified', HttpStatus.BAD_REQUEST);
      }

      user.isVerified = true;
      await user.save();

      return {
        message: 'Email verified successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error(`Error in verifyEmail: ${error.message}`, error.stack);
      if (error.name === 'TokenExpiredError') {
        throw new HttpException('Verification link has expired', HttpStatus.BAD_REQUEST);
      }
      throw new HttpException('Invalid verification link', HttpStatus.BAD_REQUEST);
    }
  }
}