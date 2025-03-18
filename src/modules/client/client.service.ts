import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ObjectId } from 'mongoose';

import { SocketGateway } from '../socket/socket.gateway';
import { RestaurantService } from '../resto/resto.service';
import { Restaurant } from '../resto/schema/resto.schema';
import { Order } from '../commands/schema/order.schema';

@Injectable()
export class ClientService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Restaurant.name) private restaurentModel: Model<Restaurant>,
  ) {}

  async getMyOrders(clientId: string) {
    try {
      const orders = await this.orderModel.find({ client: clientId }).exec();
      return orders;
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch orders.');
    }
  }
}
