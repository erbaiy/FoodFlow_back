import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Restaurant, RestaurantDocument } from 'src/modules/resto/schema/resto.schema';

@Injectable()
export class ManagerToRestoPipe implements PipeTransform<string, Promise<string>> {
  constructor(
    @InjectModel(Restaurant.name) private restaurantModel: Model<RestaurantDocument>,
  ) {}
  
  async transform(managerId: string): Promise<string> {
      const restaurant = await this.restaurantModel.findOne({ manager: managerId }).exec();
      if (!restaurant) {
          throw new BadRequestException('Aucun restaurant trouvé pour ce manager');
        }
        console.log('ManagerToRestoPipe', restaurant._id.toString());
    return restaurant._id.toString();
  }
}
