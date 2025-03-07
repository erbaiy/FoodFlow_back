// resto.service.ts
import {
  Injectable,
  NotFoundException,
  HttpStatus,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Restaurant } from './schema/resto.schema';
import CreateRestaurantDto from './dto/create-restaurant.dto';
import UpdateRestaurantDto from './dto/update-restaurant.dto';
import {
  RestaurantResponse,
  RestaurantsResponse,
  DeleteRestaurantResponse,
} from 'src/common/interfaces/restaurants/RestaurantCrudInterface';
import { UserService } from '../auth/services/userService.service';
import { MenuItemService } from '../menu-item/menu-item.service';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectModel(Restaurant.name)
    private readonly restaurantModel: Model<Restaurant>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly menuItemService: MenuItemService, // Make sure this is lowercase
  ) {}

  async createRestaurant(
    createRestaurantDto: CreateRestaurantDto,
    files: {
      logo?: Express.Multer.File[];
      cover?: Express.Multer.File[];
      banner?: Express.Multer.File[];
    },
  ): Promise<RestaurantResponse> {
    console.log('incoming files  in reso serviece', files);
    try {
      // Extract file paths
      const logoPath = files.logo?.[0]?.path;
      const bannerPath = files.banner?.[0]?.path;

      console.log('service', logoPath);
      console.log('service', bannerPath);

      if (!logoPath || !bannerPath) {
        throw new BadRequestException(
          'Logo, cover, and banner images are required',
        );
      }

      // Create new restaurant
      const restaurant = new this.restaurantModel({
        ...createRestaurantDto,
        logo: logoPath,
        banner: bannerPath,
      });

      // Save the restaurant
      const savedRestaurant = await restaurant.save();

      return {
        status: HttpStatus.CREATED,
        data: {
          message: 'Restaurant created successfully',
          result: savedRestaurant.toObject(), // Convert to plain object
        },
      };
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Error creating restaurant',
      );
    }
  }

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

  async getRestaurantById(id: string): Promise<RestaurantResponse> {
    try {
      const restaurant = await this.restaurantModel
        .findById(id)
        .populate('manager', 'name email')
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

  /**
   * Get all restaurants
   * @returns Promise with all restaurants
   */
  async getAllRestaurants(): Promise<RestaurantsResponse> {
    try {
      const restaurants = await this.restaurantModel.find().exec();

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

  async getManagerProfile(userId: string) {
    try {
      const restaurants = await this.restaurantModel
        .find({ manager:  userId})
        .exec();
        console.log('restaurants',userId)

        const restoId=restaurants[0]._id.toString();
      
      // This is returning an array, not a single user
      const manager = await this.userService.findUserByID(userId);

      const menu=await this.menuItemService.findRestoMenuItems(restoId);
      console.log('menu',menu)
      
      if (!manager) {
        throw new NotFoundException('Manager not found');
      }


      
      const formattedRestaurants = restaurants.map((restaurant) => ({
        id: restaurant._id.toString(),
        name: restaurant.name,
        cuisineType: restaurant.cuisineType,
        address: restaurant.address,
        banner: restaurant.banner,
        logo: restaurant.logo,
        manager: {
          // Access manager directly since it should be a single user document
          name: manager.fullName,
          email: manager.email,
          phone: manager.phoneNumber,
        },
        menu:menu.map((item) => ({
          // Convert _id to string if needed
          id: item._id.toString(),
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image,
        })),
      }));
      

      console.log('formattedRestaurants',formattedRestaurants)
      return {
        status: HttpStatus.OK,
        data: {
          message: 'Manager profile fetched successfully',
          result: {
            manager: {
              name: manager.fullName,
              email: manager.email,
              phone: manager.phoneNumber,
            },
            restaurants: formattedRestaurants,
            count: restaurants.length,
          },
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
