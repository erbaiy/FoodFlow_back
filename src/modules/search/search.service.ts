// src/modules/search/search.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../auth/schema/user.schema';
import { Restaurant } from '../resto/schema/resto.schema';
import { UserDocument } from '../auth/schema/user.schema';
import { RestaurantDocument } from '../resto/schema/resto.schema';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Restaurant.name) private restaurantModel: Model<RestaurantDocument>,
  ) {}

  async searchUsers(query: string): Promise<User[]> {
    return this.userModel
      .find({
        $or: [
          { fullName: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { phoneNumber: { $regex: query, $options: 'i' } },
        ],
      })
      .exec();
  }

  async searchRestaurants(query: string): Promise<Restaurant[]> {
    return this.restaurantModel
      .find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { cuisineType: { $regex: query, $options: 'i' } },
          { address: { $regex: query, $options: 'i' } },
        ],
      })
      .exec();
  }

    
}
