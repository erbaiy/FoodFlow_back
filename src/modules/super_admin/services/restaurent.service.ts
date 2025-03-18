// resto.service.ts
import {
  Injectable,
  NotFoundException,
  HttpStatus,
  BadRequestException,
  forwardRef,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import {
  RestaurantResponse,
  RestaurantsResponse,
  DeleteRestaurantResponse,
} from 'src/common/interfaces/restaurants/RestaurantCrudInterface';
import { UserService } from '../../auth/services/userService.service';
import { MenuItemService } from '../../menu-item/menu-item.service';
import { Restaurant } from 'src/modules/resto/schema/resto.schema';
import UpdateRestaurantDto from 'src/modules/resto/dto/update-restaurant.dto';
import { AuthResponse } from 'src/common/interfaces/authResponse';
import { CreateRestaurantDto } from '../dto/restaurant-dto/create-restaurant.dto';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { RestaurantService } from 'src/modules/resto/resto.service';


@Injectable()
export class SuperAdminRestaurentService  {
  constructor(

    @InjectModel(Restaurant.name)
    private readonly restaurantModel: Model<Restaurant>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly menuItemService: MenuItemService, // Make sure this is lowercase
    private readonly authServie: AuthService,
    private readonly restaurantService: RestaurantService
    
  ) {}

 



  // Create a New Restaurant Controller function



  

  //  updatae resto info by admin
  async updateRestaurant(
    id: string,
    updateRestaurantDto: UpdateRestaurantDto,
    files?: {
      logo?: Express.Multer.File[];
      cover?: Express.Multer.File[];
      banner?: Express.Multer.File[];
    },
  ): Promise<RestaurantResponse> {
    try {
      const restaurant = await this.restaurantModel.findById(id);

      if (!restaurant) {
        throw new NotFoundException('Restaurant not found');
      }

      // Update logo if provided
      if (files?.logo?.[0]?.path) {
        restaurant.logo = files.logo[0].path;
      }

      // Update cover if provided
      if (files?.cover?.[0]?.path) {
        restaurant.cover = files.cover[0].path;
      }

      // Update banner if provided
      if (files?.banner?.[0]?.path) {
        restaurant.banner = files.banner[0].path;
      }

      // Update other fields
      Object.assign(restaurant, updateRestaurantDto);

      // Save the updated restaurant
      const updatedRestaurant = await restaurant.save();

      return {
        status: HttpStatus.OK,
        data: {
          message: 'Restaurant updated successfully',
          result: updatedRestaurant.toObject(), // Convert to plain object
        },
      };
    } catch (error) {
      if (error.message.includes('already exists')) {
        return {
          status: HttpStatus.CONFLICT,
          data: {
            error: error.message,
          },
        };
      }
      return {
        status: HttpStatus.BAD_REQUEST,
        data: {
          error: error.message,
        },
      };
    }
  }

  // get all restaurant poplate the manager and  menu of this resto
  async getRestaurants(): Promise<RestaurantsResponse> {
    try {
      const restaurants = await this.restaurantModel
        .find()
        .populate('manager', 'name email')
        .populate('menu');

      return {
        status: HttpStatus.OK,
        data: {
          message: 'Restaurants fetched successfully',
          result: restaurants,
          count: restaurants.length,
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
  
  //  get a spicifique resto with id to show detail
  async getRestaurantById(id: string): Promise<RestaurantResponse> {
    try {
      const restaurant = await this.restaurantModel
        .findById(id)
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

  // delete a resto 
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
          deleted: true,
        },
      };
    } catch (error) {
      return {
        status: HttpStatus.BAD_REQUEST,
        data: {
          error: error.message,
          deleted: false,
        },
      };
    }
  }

  
  
  async getRestaurantsWithManagers() {
    try {
      const restaurants = await this.restaurantModel
        .find()
        .populate('manager', 'name email');
      return restaurants;
    } catch (error) {
      throw new Error(
        `Error fetching restaurants with managers: ${error.message}`,
      );
    }
  }


  // seach on resto for supper admin

  async findAllRestaurants(searchDto): Promise<RestaurantsResponse> {
    try {
      const restaurants = await this.restaurantModel
        .find(searchDto)
        .lean()
        .exec();
      return {
        status: HttpStatus.OK,
        data: {
          message: 'Restaurants fetched successfully',
          result: restaurants,
          count: restaurants.length,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }



  //  Approuver  demande of new resto registration
  async approveRestaurant(id: string): Promise<RestaurantResponse> {
    try {
      const restaurant = await this.restaurantModel.findById(id);

      if (!restaurant) {
        throw new NotFoundException('Restaurant not found');
      }

      restaurant.isApproved = true;
      await restaurant.save();

      return {
        status: HttpStatus.OK,
        data: {
          message: 'Restaurant approved successfully',
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

    // Rejeter une demande
  async rejectRestaurant(id: string): Promise<RestaurantResponse> {
    try {
      const restaurant = await this.restaurantModel.findById(id);

      if (!restaurant) {
        throw new NotFoundException('Restaurant not found');
      }

      restaurant.isApproved = false;
      await restaurant.save();

      return {
        status: HttpStatus.OK,
        data: {
          message: 'Restaurant rejected successfully',
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
// Obtenir la liste des demandes d'inscription
async getPendingRestaurants(): Promise<RestaurantsResponse> {
  try {
    const restaurants = await this.restaurantModel.find({ isApproved: false }).populate('manager','fullName email phoneNumber').exec();

    return {
      status: HttpStatus.OK,
      data: {
        message: 'Pending restaurants fetched successfully',
        result: restaurants,
        count: restaurants.length,
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
