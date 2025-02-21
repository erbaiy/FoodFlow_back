// resto.service.ts
import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Restaurant } from './schema/resto.schema';
import  CreateRestaurantDto  from './dto/create-restaurant.dto';
import  UpdateRestaurantDto from './dto/update-restaurant.dto';
import { RestaurantResponse, RestaurantsResponse, DeleteRestaurantResponse } from 'src/common/interfaces/restaurants/RestaurantCrudInterface';

@Injectable()
export class RestaurantService {
    constructor(
        @InjectModel(Restaurant.name) private readonly restaurantModel: Model<Restaurant>,
    ) {}

async createRestaurant(createRestaurantDto: CreateRestaurantDto): Promise<RestaurantResponse> {
    try {
        const restaurant = await this.restaurantModel.create(createRestaurantDto);
        return {
            status: HttpStatus.CREATED,
            data: {
                message: 'Restaurant created successfully',
                result: restaurant
            }
        };
    } catch (error) {
        if (error.message.includes('already exists')) {
            return {
                status: HttpStatus.CONFLICT,
                data: {
                    error: error.message
                }
            };
        }
        return {
            status: HttpStatus.BAD_REQUEST,
            data: {
                error: error.message
            }
        };
    }
}

async updateRestaurant(id: string, updateRestaurantDto: UpdateRestaurantDto): Promise<RestaurantResponse> {
    try {
        const restaurant = await this.restaurantModel.findByIdAndUpdate(
            id,
            updateRestaurantDto,
            { new: true, runValidators: true }
        ).populate('manager', 'name email')
         .populate('menu');

        if (!restaurant) {
            throw new NotFoundException('Restaurant not found');
        }

        return {
            status: HttpStatus.OK,
            data: {
                message: 'Restaurant updated successfully',
                result: restaurant
            }
        };
    } catch (error) {
        if (error.message.includes('already exists')) {
            return {
                status: HttpStatus.CONFLICT,
                data: {
                    error: error.message
                }
            };
        }
        return {
            status: HttpStatus.BAD_REQUEST,
            data: {
                error: error.message
            }
        };
    }
}

    async getRestaurants(): Promise<RestaurantsResponse> {
        try {

            
            const restaurants = await this.restaurantModel.find()
                .populate('manager', 'name email')
                .populate('menu');


            
            return {
                status: HttpStatus.OK,
                data: {
                    message: 'Restaurants fetched successfully',
                    result: restaurants,
                    count: restaurants.length
                }
            };
        } catch (error) {
            return {
                status: HttpStatus.BAD_REQUEST,
                data: {
                    error: error.message
                }
            };
        }
    }

    async getRestaurantById(id: string): Promise<RestaurantResponse> {
        try {
            const restaurant = await this.restaurantModel.findById(id)
                .populate('manager', 'name email')
                .populate('menu');

            if (!restaurant) {
                throw new NotFoundException('Restaurant not found');
            }

            return {
                status: HttpStatus.OK,
                data: {
                    message: 'Restaurant fetched successfully',
                    result: restaurant
                }
            };
        } catch (error) {
            return {
                status: HttpStatus.BAD_REQUEST,
                data: {
                    error: error.message
                }
            };
        }
    }

    

    async deleteRestaurant(id: string): Promise<DeleteRestaurantResponse> {
        try {
            const restaurant = await this.restaurantModel.findByIdAndDelete(id);

            if (!restaurant) {
                throw new NotFoundException('Restaurant not found');
            }

            return {
                status: HttpStatus.OK,
                data: {
                    message: 'Restaurant deleted successfully',
                    deleted: true
                }
            };
        } catch (error) {
            return {
                status: HttpStatus.BAD_REQUEST,
                data: {
                    error: error.message,
                    deleted: false
                }
            };
        }
    }
}
