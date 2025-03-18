// resto.controller.ts
import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,

  Param,
  HttpStatus,
  HttpCode,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  Res,
  HttpException,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

import {
  RestaurantResponse,
  RestaurantsResponse,
  DeleteRestaurantResponse,
} from 'src/common/interfaces/restaurants/RestaurantCrudInterface';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';

import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { restaurantMulterConfig } from 'src/common/config/multer.config';
import { SuperAdminRestaurentService } from '../services/restaurent.service';
import UpdateRestaurantDto from 'src/modules/resto/dto/update-restaurant.dto';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateRestaurantDto } from '../dto/restaurant-dto/create-restaurant.dto';
import { AuthResponse } from 'src/common/interfaces/authResponse';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { RestaurantService } from 'src/modules/resto/resto.service';

@ApiTags('Super Admin')

@Controller('super-admin/restaurants')
export class  SuperAdminRestaurentController
 {
  constructor(private readonly superAdminService: SuperAdminRestaurentService,
        private readonly authService: AuthService,
        private readonly restaurantService: RestaurantService
    

  )
   {}

  //  Create a New Restaurant Controller function

// @Post('create')
// @UseInterceptors(
//   FileFieldsInterceptor([
//     { name: 'logo', maxCount: 1 },
//     { name: 'cover', maxCount: 1 },
//     { name: 'banner', maxCount: 1 }
//   ], restaurantMulterConfig)
// )
// async registerRestaurant(
//   @Body() registerDto: CreateRestaurantDto,
//   @UploadedFiles() files: {
//     logo?: Express.Multer.File[];
//     cover?: Express.Multer.File[];
//     banner?: Express.Multer.File[];
//   },
//   @Res() response: Response
// ): Promise<void> {
//   try {
//     const validatedDto = plainToClass(CreateRestaurantDto, registerDto);
//     const errors = await validate(validatedDto);

//     if (errors.length > 0) {
//       throw new HttpException('Validation failed', HttpStatus.BAD_REQUEST);
//     }

//     const result = await this.authService.registerRestaurant(validatedDto, files);
//     (response as any).status(result.status).json(result);  } catch (error) {
//     if (error instanceof HttpException) {
//       throw error;
//     }
//     throw new HttpException('Restaurant registration failed', HttpStatus.INTERNAL_SERVER_ERROR);
//   }
// }  


  @Post('create')
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
      (response as any).status(result.status).json(result);
      
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Restaurant registration failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  


  // Get all Restaurants Controller

   @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get all restaurants' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Restaurants fetched successfully',
    })
    async getAllRestaurants(): Promise<RestaurantsResponse> {
      return await this.restaurantService.getAllRestaurants();
    }
  

  // Update a Restaurant Controller
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update restaurant by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Restaurant updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Restaurant not found',
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'logo', maxCount: 1 },
        { name: 'banner', maxCount: 1 },
      ],
      restaurantMulterConfig,
    ),
  )
  async updateRestaurant(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateRestaurantDto: UpdateRestaurantDto,
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      cover?: Express.Multer.File[];
    },
  ): Promise<RestaurantResponse> {
    return await this.superAdminService.updateRestaurant(
      id,
      updateRestaurantDto,
      files,
    );
  }
 // Get a Restaurant by ID 
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get restaurant by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Restaurant fetched successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Restaurant not found',
  })
  async getRestaurantById(
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<RestaurantResponse> {
    return await this.superAdminService.getRestaurantById(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete restaurant by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Restaurant deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Restaurant not found',
  })
  async deleteRestaurant(
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<DeleteRestaurantResponse> {
    return await this.superAdminService.deleteRestaurant(id);
  }

  async findAllRestaurants(searchDto): Promise<RestaurantsResponse> {
    return await this.superAdminService.findAllRestaurants(searchDto);
  }

  //  Approuver une demande
  
  @Put(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve restaurant by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Restaurant approved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Restaurant not found',
  })
  async approveRestaurant(
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<RestaurantResponse> {
    return await this.superAdminService.approveRestaurant(id);
  }

  // Rejeter une demande

  @Put(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject restaurant by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Restaurant rejected successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Restaurant not found',
  })
  async rejectRestaurant(
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<RestaurantResponse> {
    return await this.superAdminService.rejectRestaurant(id);
  }


  // Obtenir la liste des demandes d'inscription
  @Get('pending/all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get pending restaurants' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pending restaurants fetched successfully',
  })
  async getPendingRestaurants(): Promise<RestaurantsResponse> {
    console.log('getPendingRestaurants');
    return await this.superAdminService.getPendingRestaurants();
  }
}
