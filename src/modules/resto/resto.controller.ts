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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import CreateRestaurantDto from './dto/create-restaurant.dto';
import UpdateRestaurantDto from './dto/update-restaurant.dto';
import { RestaurantService } from './resto.service';
import {
  RestaurantResponse,
  RestaurantsResponse,
  DeleteRestaurantResponse,
} from 'src/common/interfaces/restaurants/RestaurantCrudInterface';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';

import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { restaurantMulterConfig } from 'src/common/config/multer.config';

@ApiTags('Restaurants')
@Controller('restaurants')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}
  
  // Create a New Restaurant Controller function
  @Post()
@HttpCode(HttpStatus.CREATED)
@ApiOperation({ summary: 'Create a new restaurant' })
@ApiConsumes('multipart/form-data')
@ApiResponse({
  status: HttpStatus.CREATED,
  description: 'Restaurant created successfully',
})
@ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
@UseInterceptors(
  FileFieldsInterceptor([
    { name: 'logo', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
    { name: 'banner', maxCount: 1 }, // Add this line
  ], restaurantMulterConfig)
)
async createRestaurant(
  @Body() createRestaurantDto: CreateRestaurantDto,
  @UploadedFiles()
  files: {
    logo?: Express.Multer.File[];
    cover?: Express.Multer.File[];
    banner?: Express.Multer.File[]; // Add this line
  }
): Promise<RestaurantResponse> {

  return await this.restaurantService.createRestaurant(createRestaurantDto, files);
}
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
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'cover', maxCount: 1 }
    ], restaurantMulterConfig)
  )
  async updateRestaurant(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateRestaurantDto: UpdateRestaurantDto,
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      cover?: Express.Multer.File[];
    }
  ): Promise<RestaurantResponse> {
    return await this.restaurantService.updateRestaurant(
      id,
      updateRestaurantDto,
      files
    );
  }

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
    return await this.restaurantService.getRestaurantById(id);
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
    return await this.restaurantService.deleteRestaurant(id);
  }
}
