import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RestaurantResponse } from 'src/common/interfaces/restaurants/RestaurantCrudInterface';
import { Restaurant } from 'src/modules/resto/schema/resto.schema';

@Injectable()
export class RestaurantManagerService {

  constructor(
     @InjectModel(Restaurant.name)
        private readonly restaurantModel: Model<Restaurant>,
  ) {}

    async restoManagerProfile(id: string): Promise<RestaurantResponse> {
      try {
        const restaurant = await this.restaurantModel
          .findOne({ manager: id })

          .populate('manager', 'fullName email phoneNumber')
          .populate('menu');
  
        if (!restaurant) {
          throw new NotFoundException('Restaurant not found');
        }
  
        return {
          status: HttpStatus.OK,
          data: {
            message: 'Restaurant fetched successfully',
            result: restaurant,
          },
        };
      } catch (error) {
        return {
          status: HttpStatus.BAD_REQUEST,
          data: {
            error: error.message,
          },
        };
      }
    }
   
}
