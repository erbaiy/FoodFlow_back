
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
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import  CreateRestaurantDto  from "./dto/create-restaurant.dto";
import  UpdateRestaurantDto  from "./dto/update-restaurant.dto";
import { RestaurantService } from './resto.service';
import { 
    RestaurantResponse, 
    RestaurantsResponse, 
    DeleteRestaurantResponse 
} from 'src/common/interfaces/restaurants/RestaurantCrudInterface';
import { ParseMongoIdPipe } from "src/common/pipes/parse-mongo-id.pipe";

@ApiTags('Restaurants')
@Controller('restaurants')
export class RestaurantController {
    constructor(
        private readonly restaurantService: RestaurantService
    ) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new restaurant' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Restaurant created successfully' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
    async createRestaurant(
        @Body() createRestaurantDto: CreateRestaurantDto
    ): Promise<RestaurantResponse> {
        return await this.restaurantService.createRestaurant(createRestaurantDto);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get all restaurants' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Restaurants fetched successfully' })
    async getRestaurants(): Promise<RestaurantsResponse> {
        return await this.restaurantService.getRestaurants();
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get restaurant by ID' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Restaurant fetched successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Restaurant not found' })
    async getRestaurantById(
        @Param('id', ParseMongoIdPipe) id: string
    ): Promise<RestaurantResponse> {
        return await this.restaurantService.getRestaurantById(id);
    }

    @Put(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update restaurant by ID' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Restaurant updated successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Restaurant not found' })
    async updateRestaurant(
        @Param('id', ParseMongoIdPipe) id: string,
        @Body() updateRestaurantDto: UpdateRestaurantDto
    ): Promise<RestaurantResponse> {
        return await this.restaurantService.updateRestaurant(id, updateRestaurantDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete restaurant by ID' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Restaurant deleted successfully' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Restaurant not found' })
    async deleteRestaurant(
        @Param('id', ParseMongoIdPipe) id: string
    ): Promise<DeleteRestaurantResponse> {
        return await this.restaurantService.deleteRestaurant(id);
    }
}