import { MenuItemService } from 'src/modules/menu-item/menu-item.service';
import { RestaurantService } from 'src/modules/resto/resto.service';
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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
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
// import UpdateRestaurantDto from '../../../../dist/modules/resto/dto/update-restaurant.dto';
import UpdateRestaurantDto from './../../resto/dto/update-restaurant.dto';
import { RestaurantManagerService } from '../service/restaurant-manager.service';

@Controller('restaurant-manager')
export class RestaurantManagerController {

    constructor(
        private readonly restaurantService: RestaurantService,
        private readonly restaurantManagerService: RestaurantManagerService,
        private readonly menuItemService: MenuItemService,
      ) {}
    
        // Create a New Restaurant Controller function
        
        
        @Put('update/:id')
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
                { name: 'cover', maxCount: 1 },
                { name: 'banner', maxCount: 1 }, // Add this line
              ],
              restaurantMulterConfig,
            )
        )
        async updateRestaurant(
          @Param('id', ParseMongoIdPipe) id: string,
          @Body() updateRestaurantDto: UpdateRestaurantDto,
          @UploadedFiles()
          files: {
            logo?: Express.Multer.File[];
            cover?: Express.Multer.File[];
            banner?: Express.Multer.File[]; // Add this line
          },
        ): Promise<RestaurantResponse> {

          console.log('files', files);
          console.log('updateRestaurantDto', updateRestaurantDto);
          return await this.restaurantService.updateRestaurant(
            id,
            updateRestaurantDto,
            files,
          );
        }
      
        @Get('restaurant-profile/:id')
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
        async restoManagerProfile(
          @Param('id', ParseMongoIdPipe) id: string,
        ): Promise<RestaurantResponse> {
          return await this.restaurantManagerService.restoManagerProfile(id);
        }
      
    
    
}
