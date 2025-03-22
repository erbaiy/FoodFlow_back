import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from './userService.service';
import { MailService } from './mailService.service';
import { RestaurantService } from 'src/modules/resto/resto.service';
import { JwtAuthService } from './jwtService.service';
import { EmailVerificationService } from './email-verification.service';
import { getModelToken } from '@nestjs/mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { User, UserDocument } from '../schema/user.schema';
import { HttpException, HttpStatus, UnauthorizedException, InternalServerErrorException, ConflictException } from '@nestjs/common';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import { CreateRestaurantDto } from '../dto/register.dto';
import { Model, Connection } from 'mongoose';
import { Response } from 'express';

// Mock models and dependencies
const mockUserModel = () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockConnection = () => ({
  startSession: jest.fn().mockReturnValue({
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  }),
});

const mockUserService = () => ({
  registerUser: jest.fn(),
  findByEmail: jest.fn(),
  deleteUser: jest.fn(),
});

const mockEmailVerificationService = () => ({
  sendEmailVerification: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
});

const mockMailService = () => ({
  sendVerificationEmail: jest.fn(),
});

const mockJwtAuthService = () => ({
  generateToken: jest.fn(),
  verifyToken: jest.fn(),
});

const mockRestaurantService = () => ({
  createRestaurant: jest.fn(),
  findRestaurantByName: jest.fn(),
  getRestaurantsWithManagers: jest.fn(),
});

// Mock response object
const mockResponse = () => {
  const res: Partial<Response> = {
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    removeHeader: jest.fn().mockReturnThis(),
  };
  return res as Response;
};

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let emailVerificationService: EmailVerificationService;
  let mailService: MailService;
  let jwtAuthService: JwtAuthService;
  let restaurantService: RestaurantService;
  let userModel: Model<UserDocument>;
  let connection: Connection;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useFactory: mockUserService },
        { provide: EmailVerificationService, useFactory: mockEmailVerificationService },
        { provide: MailService, useFactory: mockMailService },
        { provide: JwtAuthService, useFactory: mockJwtAuthService },
        { provide: RestaurantService, useFactory: mockRestaurantService },
        { provide: getModelToken(User.name), useFactory: mockUserModel },
        { provide: getConnectionToken(), useFactory: mockConnection },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    emailVerificationService = module.get<EmailVerificationService>(EmailVerificationService);
    mailService = module.get<MailService>(MailService);
    jwtAuthService = module.get<JwtAuthService>(JwtAuthService);
    restaurantService = module.get<RestaurantService>(RestaurantService);
    userModel = module.get<Model<UserDocument>>(getModelToken(User.name));
    connection = module.get<Connection>(getConnectionToken());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDto = { email: 'test@example.com', password: 'password123' };
    const mockUser = {
      _id: 'user_id_123',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'client',
      isVerified: true,
      comparePassword: jest.fn().mockResolvedValue(true),
    } as unknown as UserDocument;

    it('should successfully login a user and set cookies', async () => {
      // Arrange
      const response = mockResponse();
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(jwtAuthService, 'generateToken')
        .mockReturnValueOnce('access_token_123')
        .mockReturnValueOnce('refresh_token_123');

      // Act
      const result = await authService.login(loginDto, response);

      // Assert
      expect(userService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockUser.comparePassword).toHaveBeenCalledWith(loginDto.password);
      expect(jwtAuthService.generateToken).toHaveBeenCalledTimes(2);
      expect(response.cookie).toHaveBeenCalledTimes(2);
      expect(response.setHeader).toHaveBeenCalledWith('Authorization', 'Bearer access_token_123');
      expect(result.status).toBe(HttpStatus.OK);
      expect(result.data.accessToken).toBe('access_token_123');
      expect(result.data.user.id).toBe('user_id_123');
    });

    it('should throw UnauthorizedException if invalid credentials', async () => {
      // Arrange
      const response = mockResponse();
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(loginDto, response)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      // Arrange
      const response = mockResponse();
      const userWithWrongPass = { ...mockUser, comparePassword: jest.fn().mockResolvedValue(false) } as unknown as UserDocument;
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(userWithWrongPass);

      // Act & Assert
      await expect(authService.login(loginDto, response)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if email not verified', async () => {
      // Arrange
      const response = mockResponse();
      const unverifiedUser = { ...mockUser, isVerified: false } as unknown as UserDocument;
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(unverifiedUser);
      jest.spyOn(emailVerificationService, 'sendEmailVerification').mockResolvedValue(true);

      // Act & Assert
      await expect(authService.login(loginDto, response)).rejects.toThrow(UnauthorizedException);
      expect(emailVerificationService.sendEmailVerification).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    const mockRefreshToken = 'valid_refresh_token';
    const mockUser = {
      _id: 'user_id_123',
      email: 'test@example.com',
      role: 'client',
    } as unknown as UserDocument;

    it('should successfully refresh tokens', async () => {
      // Arrange
      const response = mockResponse();
      jest.spyOn(jwtAuthService, 'verifyToken').mockResolvedValue({
        sub: mockUser._id,
        email: mockUser.email,
        role: mockUser.role,
      });
      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(jwtAuthService, 'generateToken')
        .mockReturnValueOnce('new_access_token')
        .mockReturnValueOnce('new_refresh_token');

      // Act
      const result = await authService.refreshToken(mockRefreshToken, response);

      // Assert
      expect(jwtAuthService.verifyToken).toHaveBeenCalledWith(mockRefreshToken);
      expect(userModel.findById).toHaveBeenCalledWith(mockUser._id);
      expect(jwtAuthService.generateToken).toHaveBeenCalledTimes(2);
      expect(response.cookie).toHaveBeenCalledTimes(2);
      expect(result.status).toBe(HttpStatus.OK);
      expect(result.data.accessToken).toBe('new_access_token');
    });

    it('should throw UnauthorizedException if token verification fails', async () => {
      // Arrange
      const response = mockResponse();
      jest.spyOn(jwtAuthService, 'verifyToken').mockRejectedValue(new Error('Invalid token'));

      // Act & Assert
      await expect(authService.refreshToken(mockRefreshToken, response)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      const response = mockResponse();
      jest.spyOn(jwtAuthService, 'verifyToken').mockResolvedValue({
        sub: mockUser._id,
      });
      jest.spyOn(userModel, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(authService.refreshToken(mockRefreshToken, response)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('registerClient', () => {
    const registerDto: RegisterDto = {
      email: 'new@example.com',
      password: 'password123',
      fullName: 'New User',
      role: 'client',
    };
  
    it('should successfully register a client user', async () => {
      // Arrange
      const mockRegisteredUser = {
        _id: 'new_user_id',
        email: registerDto.email,
        fullName: registerDto.fullName,
        password: registerDto.password,
        role: registerDto.role,
        address: 'address',
        phoneNumber: 'phoneNumber',
        isVerified: false,
        loginHistory: {
          history: [],
          lastLogin: new Date(),
        },
        comparePassword: jest.fn().mockResolvedValue(true),
      } as unknown as UserDocument;
  
      jest.spyOn(userService, 'registerUser').mockResolvedValue({
        success: true,
        user: mockRegisteredUser,
      });
      jest.spyOn(emailVerificationService, 'sendEmailVerification').mockResolvedValue(true);
  
      // Act
      const result = await authService.registerClient(registerDto);
  
      // Assert
      expect(userService.registerUser).toHaveBeenCalledWith(registerDto);
      expect(emailVerificationService.sendEmailVerification).toHaveBeenCalledWith(
        'new_user_id',
        registerDto.email
      );
      expect(result.status).toBe(HttpStatus.CREATED);
      expect(result.data.userId).toBe('new_user_id');
    });
  
    it('should throw HttpException if registration fails', async () => {
      // Arrange
      jest.spyOn(userService, 'registerUser').mockResolvedValue({
        success: false,
        error: 'Email already exists',
      });
  
      // Act & Assert
      await expect(authService.registerClient(registerDto)).rejects.toThrow(HttpException);
    });
  
    it('should throw InternalServerErrorException if verification email fails', async () => {
      // Arrange
      const mockRegisteredUser = {
        _id: 'new_user_id',
        email: registerDto.email,
        fullName: registerDto.fullName,
        password: registerDto.password,
        role: registerDto.role,
        address: 'address',
        phoneNumber: 'phoneNumber',
        isVerified: false,
        loginHistory: {
          history: [],
          lastLogin: new Date(),
        },
        comparePassword: jest.fn().mockResolvedValue(true),
      } as unknown as UserDocument;
  
      jest.spyOn(userService, 'registerUser').mockResolvedValue({
        success: true,
        user: mockRegisteredUser,
      });
      jest.spyOn(emailVerificationService, 'sendEmailVerification').mockResolvedValue(false);
  
      // Act & Assert
      await expect(authService.registerClient(registerDto)).rejects.toThrow( HttpException);
    });
  });

  // describe('registerRestaurant', () => {
  //   const restaurantDto: CreateRestaurantDto = {
  //     name: 'Test Restaurant',
  //     email: 'restaurant@example.com',
  //     password: 'Password123',
  //     fullName: 'Restaurant Manager',
  //     phoneNumber: '+1234567890',
  //     address: '123 Test St',
  //     location: '40.7128° N, 74.0060° W',
  //     role: 'restaurant',
  //   };
  //   const mockFiles = {
  //     logo: [{ filename: 'logo.jpg' }] as Express.Multer.File[],
  //   };

  //   it('should successfully register a restaurant with manager', async () => {
  //     // Arrange
  //     const mockUserId = 'manager_user_id';
  //     const mockSession = connection.startSession();

  //     // Mock successful user registration
  //     jest.spyOn(authService as any, 'registerAndVerifyUser').mockResolvedValue({
  //       status: HttpStatus.CREATED,
  //       data: {
  //         userId: mockUserId,
  //         message: 'User created successfully',
  //       },
  //     });

  //     // Mock restaurant checks
  //     jest.spyOn(restaurantService, 'findRestaurantByName').mockResolvedValue(null);
  //     jest.spyOn(restaurantService, 'createRestaurant').mockResolvedValue({} as any);

  //     // Act
  //     const result = await authService.registerRestaurant(restaurantDto, mockFiles);

  //     // Assert
  //     expect(connection.startSession).toHaveBeenCalled();
  //     expect(mockSession.startTransaction).toHaveBeenCalled();
  //     expect(authService['registerAndVerifyUser']).toHaveBeenCalled();
  //     expect(restaurantService.findRestaurantByName).toHaveBeenCalledWith(restaurantDto.name);
  //     expect(restaurantService.createRestaurant).toHaveBeenCalled();
  //     expect(mockSession.commitTransaction).toHaveBeenCalled();
  //     expect(mockSession.endSession).toHaveBeenCalled();
  //     expect(result.status).toBe(HttpStatus.CREATED);
  //     expect(result.data.userId).toBe(mockUserId);
  //   });

  //   it('should throw ConflictException if restaurant name already exists', async () => {
  //     // Arrange
  //     const mockUserId = 'manager_user_id';
  //     const mockSession = connection.startSession();

  //     // Mock successful user registration
  //     jest.spyOn(authService as any, 'registerAndVerifyUser').mockResolvedValue({
  //       status: HttpStatus.CREATED,
  //       data: {
  //         userId: mockUserId,
  //         message: 'User created successfully',
  //       },
  //     });

  //     // Mock restaurant name check - exists
  //     jest.spyOn(restaurantService, 'findRestaurantByName').mockResolvedValue({} as any);
  //     jest.spyOn(userService, 'deleteUser').mockResolvedValue(true);

  //     // Act & Assert
  //     await expect(authService.registerRestaurant(restaurantDto, mockFiles)).rejects.toThrow(ConflictException);
  //     expect(mockSession.abortTransaction).toHaveBeenCalled();
  //     expect(userService.deleteUser).toHaveBeenCalledWith(mockUserId);
  //   });

  //   it('should rollback and delete user if restaurant creation fails', async () => {
  //     // Arrange
  //     const mockUserId = 'manager_user_id';
  //     const mockSession = connection.startSession();

  //     // Mock successful user registration
  //     jest.spyOn(authService as any, 'registerAndVerifyUser').mockResolvedValue({
  //       status: HttpStatus.CREATED,
  //       data: {
  //         userId: mockUserId,
  //         message: 'User created successfully',
  //       },
  //     });

  //     // Mock restaurant checks
  //     jest.spyOn(restaurantService, 'findRestaurantByName').mockResolvedValue(null);
  //     jest.spyOn(restaurantService, 'createRestaurant').mockRejectedValue(new Error('Restaurant creation failed'));
  //     jest.spyOn(userService, 'deleteUser').mockResolvedValue(true);

  //     // Act & Assert
  //     await expect(authService.registerRestaurant(restaurantDto, mockFiles)).rejects.toThrow(InternalServerErrorException);
  //     expect(mockSession.abortTransaction).toHaveBeenCalled();
  //     expect(userService.deleteUser).toHaveBeenCalledWith(mockUserId);
  //   });
  // });

  describe('verifyEmail', () => {
    const mockToken = 'valid_verification_token';
    const mockUser = {
      _id: 'user_id_123',
      email: 'test@example.com',
      isVerified: false,
      save: jest.fn().mockResolvedValue(true),
    } as unknown as UserDocument;

    it('should successfully verify email', async () => {
      // Arrange
      jest.spyOn(jwtAuthService, 'verifyToken').mockResolvedValue({
        sub: mockUser._id,
      });
      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser);

      // Act
      const result = await authService.verifyEmail(mockToken);

      // Assert
      expect(jwtAuthService.verifyToken).toHaveBeenCalledWith(mockToken);
      expect(userModel.findById).toHaveBeenCalledWith(mockUser._id);
      expect(mockUser.save).toHaveBeenCalled();
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('Email verified successfully');
    });

    it('should return already verified message if user already verified', async () => {
      // Arrange
      const verifiedUser = { ...mockUser, isVerified: true } as unknown as UserDocument;
      jest.spyOn(jwtAuthService, 'verifyToken').mockResolvedValue({
        sub: verifiedUser._id,
      });
      jest.spyOn(userModel, 'findById').mockResolvedValue(verifiedUser);

      // Act
      const result = await authService.verifyEmail(mockToken);

      // Assert
      expect(verifiedUser.save).not.toHaveBeenCalled();
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('Email already verified');
    });

    it('should throw BadRequest if no token provided', async () => {
      // Act & Assert
      await expect(authService.verifyEmail('')).rejects.toThrow(HttpException);
    });

    it('should throw NotFound if user not found', async () => {
      // Arrange
      jest.spyOn(jwtAuthService, 'verifyToken').mockResolvedValue({
        sub: 'non_existent_id',
      });
      jest.spyOn(userModel, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(authService.verifyEmail(mockToken)).rejects.toThrow(HttpException);
    });

    it('should throw BadRequest if token expired', async () => {
      // Arrange
      const tokenError = new Error('TokenExpiredError');
      tokenError.name = 'TokenExpiredError';
      jest.spyOn(jwtAuthService, 'verifyToken').mockRejectedValue(tokenError);

      // Act & Assert
      await expect(authService.verifyEmail(mockToken)).rejects.toThrow(HttpException);
    });
  });

  describe('forgetPassword', () => {
    const testEmail = 'test@example.com';
    const mockUser = {
      _id: 'user_id_123',
      email: testEmail,
      role: 'client',
    } as unknown as UserDocument;

    it('should send password reset email successfully', async () => {
      // Arrange
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(jwtAuthService, 'generateToken').mockReturnValue('reset_token_123');
      jest.spyOn(emailVerificationService, 'sendPasswordResetEmail').mockResolvedValue(true);

      // Act
      const result = await authService.forgetPassword(testEmail);

      // Assert
      expect(userService.findByEmail).toHaveBeenCalledWith(testEmail);
      expect(jwtAuthService.generateToken).toHaveBeenCalled();
      expect(emailVerificationService.sendPasswordResetEmail).toHaveBeenCalledWith(
        testEmail,
        'reset_token_123'
      );
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('Password reset email sent successfully');
    });

    it('should throw NotFound if user does not exist', async () => {
      // Arrange
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(null);

      // Act & Assert
      await expect(authService.forgetPassword(testEmail)).rejects.toThrow(HttpException);
    });

    it('should throw InternalServerErrorException if email sending fails', async () => {
      // Arrange
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(jwtAuthService, 'generateToken').mockReturnValue('reset_token_123');
      jest.spyOn(emailVerificationService, 'sendPasswordResetEmail').mockResolvedValue(false);

      // Act & Assert
      await expect(authService.forgetPassword(testEmail)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('resetPassword', () => {
    const mockToken = 'valid_reset_token';
    const newPassword = 'new_password_123';
    const mockUser = {
      _id: 'user_id_123',
      email: 'test@example.com',
      password: 'old_password',
      save: jest.fn().mockResolvedValue(true),
    } as unknown as UserDocument;

    it('should reset password successfully', async () => {
      // Arrange
      jest.spyOn(jwtAuthService, 'verifyToken').mockResolvedValue({
        id: mockUser._id,
      });
      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser);

      // Act
      const result = await authService.resetPassword(mockToken, newPassword);

      // Assert
      expect(jwtAuthService.verifyToken).toHaveBeenCalledWith(mockToken);
      expect(userModel.findById).toHaveBeenCalledWith(mockUser._id);
      expect(mockUser.password).toBe(newPassword);
      expect(mockUser.save).toHaveBeenCalled();
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('Password reset successfully');
    });

    it('should throw BadRequest if no token provided', async () => {
      // Act & Assert
      await expect(authService.resetPassword('', newPassword)).rejects.toThrow(HttpException);
    });

    it('should throw NotFound if user not found', async () => {
      // Arrange
      jest.spyOn(jwtAuthService, 'verifyToken').mockResolvedValue({
        id: 'non_existent_id',
      });
      jest.spyOn(userModel, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(authService.resetPassword(mockToken, newPassword)).rejects.toThrow(HttpException);
    });

    it('should throw BadRequest if token expired', async () => {
      // Arrange
      const tokenError = new Error('TokenExpiredError');
      tokenError.name = 'TokenExpiredError';
      jest.spyOn(jwtAuthService, 'verifyToken').mockRejectedValue(tokenError);

      // Act & Assert
      await expect(authService.resetPassword(mockToken, newPassword)).rejects.toThrow(HttpException);
    });
  });

  describe('getUserById', () => {
    const userId = 'user_id_123';
    const mockUser = {
      _id: userId,
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'client',
    } as unknown as UserDocument;

    it('should return user by id', async () => {
      // Arrange
      const mockSelect = { select: jest.fn().mockResolvedValue(mockUser) };
      jest.spyOn(userModel, 'findById').mockReturnValue(mockSelect as any);

      // Act
      const result = await authService.getUserById(userId);

      // Assert
      expect(userModel.findById).toHaveBeenCalledWith(userId);
      expect(mockSelect.select).toHaveBeenCalledWith('-password');
      expect(result).toBe(mockUser);
    });

    it('should throw NotFound if user not found', async () => {
      // Arrange
      const mockSelect = { select: jest.fn().mockResolvedValue(null) };
      jest.spyOn(userModel, 'findById').mockReturnValue(mockSelect as any);

      // Act & Assert
      await expect(authService.getUserById(userId)).rejects.toThrow(HttpException);
    });

    it('should throw InternalServerErrorException on database error', async () => {
      // Arrange
      const mockSelect = { select: jest.fn().mockRejectedValue(new Error('Database error')) };
      jest.spyOn(userModel, 'findById').mockReturnValue(mockSelect as any);

      // Act & Assert
      await expect(authService.getUserById(userId)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('logout', () => {
    it('should clear cookies and remove authorization header', async () => {
      // Arrange
      const response = mockResponse();

      // Act
      await authService.logout(response);

      // Assert
      expect(response.clearCookie).toHaveBeenCalledTimes(2);
      expect(response.removeHeader).toHaveBeenCalledWith('Authorization');
    });

    it('should throw InternalServerErrorException if logout fails', async () => {
      // Arrange
      const response = mockResponse();
      jest.spyOn(response, 'clearCookie').mockImplementation(() => {
        throw new Error('Failed to clear cookie');
      });

      // Act & Assert
      await expect(authService.logout(response)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getRestaurantsWithManagers', () => {
    it('should return restaurants with managers', async () => {
      // Arrange
      const mockRestaurants = [
        { name: 'Restaurant 1', manager: { fullName: 'Manager 1' } },
        { name: 'Restaurant 2', manager: { fullName: 'Manager 2' } },
      ];
      jest.spyOn(restaurantService, 'getRestaurantsWithManagers').mockResolvedValue(mockRestaurants as any);

      // Act
      const result = await authService.getRestaurantsWithManagers();

      // Assert
      expect(restaurantService.getRestaurantsWithManagers).toHaveBeenCalled();
      expect(result).toEqual(mockRestaurants);
    });

    it('should throw InternalServerErrorException if fetch fails', async () => {
      // Arrange
      jest.spyOn(restaurantService, 'getRestaurantsWithManagers').mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(authService.getRestaurantsWithManagers()).rejects.toThrow(InternalServerErrorException);
    });
  });
});