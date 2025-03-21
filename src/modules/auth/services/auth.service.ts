import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  UnauthorizedException,
  InternalServerErrorException,
  Inject,
  forwardRef,
  ConflictException,
} from '@nestjs/common';
import { UserService } from './userService.service';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { User, UserDocument } from '../schema/user.schema';
import { MailService } from './mailService.service';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import { Response } from 'express';
import { RestaurantService } from 'src/modules/resto/resto.service';
import { CreateRestaurantDto } from '../dto/register.dto';
import { JwtAuthService } from './jwtService.service';
import { AuthResponse } from '../../../common/interfaces/authResponse';
import { EmailVerificationService } from './email-verification.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly userService: UserService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly mailService: MailService,
    private readonly jwtAuthService: JwtAuthService,
    @Inject(forwardRef(() => RestaurantService))
    private readonly restaurantService: RestaurantService,
  ) {}

  /**
   * Handle user login
   */
  async login(
    credentials: LoginDto,
    response: Response,
  ): Promise<AuthResponse> {
    try {
      const user = await this.validateUser(credentials);
      await this.checkEmailVerification(user);

      const payload = {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtAuthService.generateToken(payload, 'access');
      const refreshToken = this.jwtAuthService.generateToken(payload, 'refresh');

      this.setAuthCookies(response, { accessToken, refreshToken });

      return {
        status: HttpStatus.OK,
        data: {
          message: 'Login successful',
          user: {
            id: user._id.toString(),
            fullName: user.fullName,
            email: user.email,
            role: user.role,
          },
          accessToken,
        },
      };
    } catch (error) {
      this.logger.error(`Login failed for ${credentials.email}: ${error.message}`, error.stack);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(
    refreshToken: string,
    response: Response,
  ): Promise<AuthResponse> {
    try {
      // Verify the token and get the decoded payload
      const decoded = await this.verifyToken(refreshToken);
      
      const user = await this.userModel.findById(decoded.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const payload = {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtAuthService.generateToken(payload, 'access');
      const newRefreshToken = this.jwtAuthService.generateToken(payload, 'refresh');

      this.setAuthCookies(response, { 
        accessToken, 
        refreshToken: newRefreshToken 
      });

      return {
        status: HttpStatus.OK,
        data: {
          message: 'Token refreshed successfully',
          accessToken,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Register a new client user
   */
  async registerClient(body: RegisterDto): Promise<AuthResponse> {
    try {
      const registrationResult = await this.registerAndVerifyUser(body);
      return registrationResult;
    } catch (error) {
      this.logger.error(`Registration error: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Registration failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Register a new restaurant with its manager
   */
  async registerRestaurant(
    dto: CreateRestaurantDto,
    files: {
      logo?: Express.Multer.File[];
      cover?: Express.Multer.File[];
      banner?: Express.Multer.File[];
    },
  ): Promise<AuthResponse> {
    const session = await this.connection.startSession();
    let userId: string | null = null;

    try {
      session.startTransaction();

      // Extract user data from restaurant DTO
      const userData = {
        email: dto.email,
        password: dto.password,
        fullName: dto.fullName,
        phoneNumber: dto.phoneNumber,
        address: dto.address,
        role: dto.role,
      };

      // Register the user first
      const registrationResult = await this.registerAndVerifyUser(userData);

      if (!registrationResult.data || !registrationResult.data.userId) {
        throw new InternalServerErrorException('User registration failed');
      }

      userId = registrationResult.data.userId;

      // Check if restaurant name already exists
      const existingRestaurant = await this.restaurantService.findRestaurantByName(dto.name);
      if (existingRestaurant) {
        throw new ConflictException('Restaurant name already exists');
      }

      // Create restaurant data
      const restaurantData: CreateRestaurantDto = {
        ...dto,
        manager: userId,
        isApproved: dto.isApproved || false,
        menu: dto.menu || [],
      };

      // Create the restaurant
      await this.restaurantService.createRestaurant(restaurantData, files);
      
      await session.commitTransaction();

      return {
        status: HttpStatus.CREATED,
        data: {
          message: 'Restaurant registered successfully. Check your email for verification.',
          userId,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      
      this.logger.error(`Restaurant registration error: ${error.message}`, error.stack);
      
      // Attempt to rollback user creation if restaurant creation fails
      if (userId) {
        try {
          await this.userService.deleteUser(userId);
        } catch (rollbackError) {
          this.logger.error(`Rollback error: ${rollbackError.message}`, rollbackError.stack);
        }
      }
      
      if (error instanceof ConflictException) {
        throw error;
      }
      
      throw new InternalServerErrorException(error.message || 'Registration failed');
    } finally {
      session.endSession();
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(
    token: string,
  ): Promise<{ message: string; statusCode: number }> {
    if (!token) {
      throw new HttpException('No token provided', HttpStatus.BAD_REQUEST);
    }

    try {
      const decoded = await this.verifyToken(token);
      const user = await this.userModel.findById(decoded.sub);
      
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      
      return await this.completeEmailVerification(user);
    } catch (error) {
      throw this.handleVerificationError(error);
    }
  }

  /**
   * Initiate password reset process
   */
  // services/auth.service.ts
async forgetPassword(email: string): Promise<{ message: string; statusCode: number }> {
  const user = await this.userService.findByEmail(email);
  if (!user) {
    throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  }

  const token = this.jwtAuthService.generateToken(
    { id: user._id.toString(), email: user.email, role: user.role },
    'reset', // Use the correct token type
  );

  const emailSent = await this.emailVerificationService.sendPasswordResetEmail(
    user.email,
    token,
  );

  if (!emailSent) {
    throw new InternalServerErrorException('Failed to send password reset email');
  }

  return {
    message: 'Password reset email sent successfully',
    statusCode: HttpStatus.OK,
  };
}

  /**
   * Reset password with token
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string; statusCode: number }> {
    if (!token) {
      throw new HttpException('No token provided', HttpStatus.BAD_REQUEST);
    }

    try {
      const decoded = await this.verifyToken(token);
      console.log('decoded',decoded);
      const user = await this.userModel.findById(decoded.id);
      
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
  
      user.password = newPassword;
      await user.save();
      
      return {
        message: 'Password reset successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new HttpException('Reset link has expired', HttpStatus.BAD_REQUEST);
      }

      throw new InternalServerErrorException('Failed to reset password');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserDocument> {
    try {
      const user = await this.userModel.findById(userId).select('-password');
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      return user;
    } catch (error) {
      this.logger.error(`Error fetching user by ID: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve user information');
    }
  }

  /**
   * Logout user by clearing cookies
   */
  async logout(response: Response): Promise<void> {
    try {
      this.clearAuthCookies(response);
    } catch (error) {
      this.logger.error(`Logout error: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to logout');
    }
  }

  /**
   * Get restaurants with managers (admin function)
   */
  async getRestaurantsWithManagers() {
    try {
      return await this.restaurantService.getRestaurantsWithManagers();
    } catch (error) {
      this.logger.error(`Error fetching restaurants with managers: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch restaurants with managers');
    }
  }

  // Helper methods
  
  /**
   * Register a user and send verification email
   */
  private async registerAndVerifyUser(
    userData: RegisterDto,
  ): Promise<AuthResponse> {
    const registered = await this.userService.registerUser(userData);
  
    if (!registered.success) {
      throw new HttpException(registered.error, HttpStatus.BAD_REQUEST);
    }
  
    if (!registered.user?._id || !registered.user?.email) {
      throw new InternalServerErrorException(
        'Invalid user data after registration',
      );
    }
  
    const userId = registered.user._id.toString();
    
    const emailSent = await this.sendVerificationEmail(userId, registered.user.email);
  
    if (!emailSent) {
      throw new InternalServerErrorException(
        'Failed to send verification email',
      );
    }
  
    return {
      status: HttpStatus.CREATED,
      data: {
        userId,
        message: 'User created successfully. Check your email for verification',
      },
    };
  }
  
  /**
   * Validate user login credentials
   */
  private async validateUser(credentials: LoginDto): Promise<UserDocument> {
    const user = await this.userService.findByEmail(credentials.email);
    if (!user || !(await user.comparePassword(credentials.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  /**
   * Verify if user's email is verified or send a new verification email
   */
  private async checkEmailVerification(user: UserDocument): Promise<void> {
    if (!user.isVerified) {
      const emailSent = await this.sendVerificationEmail(
        user._id.toString(),
        user.email,
      );

      if (!emailSent) {
        throw new InternalServerErrorException(
          'Failed to send verification email',
        );
      }

      throw new UnauthorizedException(
        'Email not verified. Check your email for verification',
      );
    }
  }

  /**
   * Complete email verification process
   */
  private async completeEmailVerification(
    user: UserDocument,
  ): Promise<{ message: string; statusCode: number }> {
    if (user.isVerified) {
      return {
        message: 'Email already verified',
        statusCode: HttpStatus.OK,
      };
    }

    user.isVerified = true;
    await user.save();

    return {
      message: 'Email verified successfully',
      statusCode: HttpStatus.OK,
    };
  }

  /**
   * Send verification email
   */
  private async sendVerificationEmail(
    userId: string,
    email: string,
  ): Promise<boolean> {
    return this.emailVerificationService.sendEmailVerification(userId, email);
  }

  /**
   * Set authentication cookies
   */
  private setAuthCookies(
    response: Response,
    tokens: { accessToken: string; refreshToken: string },
  ): void {
    const secure = process.env.NODE_ENV === 'production';
    
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
  private clearAuthCookies(response: Response): void {
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
   * Parse duration string to milliseconds
   */
  private parseDuration(duration: string): number {
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
   * Verify JWT token
   */
  private async verifyToken(token: string): Promise<any> {
    try {
      // Note: Implement this in JwtAuthService
      return await this.jwtAuthService.verifyToken(token);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new HttpException('Token has expired', HttpStatus.UNAUTHORIZED);
      }
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: Error): never {
    this.logger.error(`Auth error: ${error.message}`, error.stack);
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException('An unexpected error occurred');
  }

  /**
   * Handle verification errors
   */
  private handleVerificationError(error: Error): never {
    this.logger.error(`Verification error: ${error.message}`, error.stack);
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
