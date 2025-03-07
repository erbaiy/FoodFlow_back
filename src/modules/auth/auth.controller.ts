















import {
  Controller,
  Post,
  Body,
  HttpStatus,
  Get,
  Query,
  Res,
  HttpCode,
  ValidationPipe,
  UseGuards,
  Req,
  HttpException,
  UploadedFiles,
  Delete,
  Param,
  Put,
} from '@nestjs/common';
import { AuthService } from './services/auth.service';
import {
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  ForgotPasswordDto,
} from './dto/auth.dto';
import { Response, Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthResponse } from '../../common/interfaces/authResponse';
import {
  JwtAuthGuard,
  Token,
  TokenLocation,
} from '../../common/guards/JwtAuthGuard.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UseInterceptors } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateRestaurantDto } from './dto/register.dto';
import { restaurantMulterConfig } from 'src/common/config/multer.config';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserService } from './services/userService.service';



@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService,
    private readonly userService:UserService
  ) {}

 

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully logged in',
  })
  @ApiBody({ type: LoginDto })
  async login(
    @Body(new ValidationPipe()) loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    return this.authService.login(loginDto, response);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @Token(TokenLocation.COOKIES)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token successfully refreshed',
  })
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const refreshToken = request.cookies?.refreshToken;
    if (!refreshToken) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        data: {
          message: 'Refresh token not found',
        },
      };
    }
    return this.authService.refreshToken(refreshToken, response);
  }

  // @Post('logout')
  // @HttpCode(HttpStatus.OK)
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'User logout' })
  // async logout(@Res({ passthrough: true }) response: Response) {
  //   // Clear both tokens
  //   response.clearCookie('refreshToken', {
  //     httpOnly: true,
  //     secure: process.env.NODE_ENV === 'production',
  //     sameSite: 'strict',
  //     path: '/',
  //   });

  //   response.clearCookie('accessToken', {
  //     httpOnly: true,
  //     secure: process.env.NODE_ENV === 'production',
  //     sameSite: 'strict',
  //     path: '/',
  //   });

  //   return {
  //     status: HttpStatus.OK,
  //     data: {
  //       message: 'Successfully logged out',
  //     },
  //   };
  // }

  // Protected route example
  @Get('protected')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Protected route example' })
  async protectedRoute(@Req() request: Request) {
    return {
      status: HttpStatus.OK,
      data: {
        message: 'Access granted',
        user: request['decoded'],
      },
    };
  }
  //
  @Post('register/user')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiBody({ type: RegisterDto })
  async register(
    @Body(new ValidationPipe()) registerDto: RegisterDto
  ): Promise<AuthResponse> {
    return this.authService.registerClient(registerDto);
  }

  
  @Post('register/restaurant')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'cover', maxCount: 1 },
      { name: 'banner', maxCount: 1 }, // Add this line
    ], restaurantMulterConfig)
  )
  async registerRestaurant(
    @Body() registerDto: CreateRestaurantDto,
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      cover?: Express.Multer.File[];
      banner?: Express.Multer.File[]; // Add this line
    },
    @Res() response: Response,
  ): Promise<void> {
    console.log('file',files)
    
    try {
      const validatedDto = plainToClass(CreateRestaurantDto, registerDto);
      const errors = await validate(validatedDto);

      if (errors.length > 0) {
        throw new HttpException('Validation failed', HttpStatus.BAD_REQUEST);
      }

      const result = await this.authService.registerRestaurant(validatedDto, files);
      response.status(result.status).json(result);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Restaurant registration failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  
  

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email successfully verified',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired token',
  })
async verifyEmail(
    @Query('token') token: string,
): Promise<{ message: string; statusCode: number }> {
    return this.authService.verifyEmail(token);
}


  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset email sent',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiBody({ type: ForgotPasswordDto })
  async forgotPassword(
    @Body(new ValidationPipe()) { email }: ForgotPasswordDto,
  ): Promise<{ message: string; statusCode: number }> {
    return this.authService.forgetPassword(email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password successfully reset',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired token',
  })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(
    @Query('token') token: string,
    @Body(new ValidationPipe()) { newPassword }: ResetPasswordDto,
  ): Promise<{ message: string; statusCode: number }> {
    return this.authService.resetPassword(token, newPassword);
  }
  @UseGuards(JwtAuthGuard)
  @Get('gestionnaire')
  @Roles('livreur') // Seul les gestionnaires peuvent accéder à cette route
  getAdminDashboard() {
    return 'gestionnaire dashboard';
  }


@Get('me')
@UseGuards(JwtAuthGuard)
async getMe(@Req() req: Request) {
  const user = await this.authService.getUserById(req['decoded'].sub);
  return { status: HttpStatus.OK, data: user };
}

@Post('logout')
@UseGuards(JwtAuthGuard)
async logout(@Res() res: Response) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  return res.send({ message: 'Logged out' });
}
// super admin
@Get('users')
async getUsers() {
  return this.userService.getUsers()    ;
}



// update user role
@Put('users/:id/role')
async updateUserRole(@Param('id') id: string, @Body('role') role: string) {
  return this.userService.updateUserRole(id, role);
}
//  delter user
@Delete('users/:id')
async deleteUser(@Param('id') id: string) {
  return this.userService.deleteUser(id);
}


  // Récupérer les gestionnaires de restaurants avec leurs restaurants associés :

  @Get('restaurants')
  async getRestaurantsWithManagers() {
    return this.authService.getRestaurantsWithManagers();
  }
  

 }





