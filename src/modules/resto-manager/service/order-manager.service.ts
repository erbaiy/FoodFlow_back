import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from 'src/modules/auth/schema/user.schema';
import { CreateOrderDto } from 'src/modules/commands/dto/create-order-status.dto';
import { OrderStatus, UpdateOrderStatusDto } from 'src/modules/commands/dto/update-order-status.dto';
import { Order } from 'src/modules/commands/schema/order.schema';
import { RestaurantService } from 'src/modules/resto/resto.service';
import { Restaurant } from 'src/modules/resto/schema/resto.schema';
import { SocketGateway } from 'src/modules/socket/socket.gateway';


@Injectable()
export class  OrderManagerService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Restaurant.name) private restaurentModel: Model<Restaurant>,
    @InjectModel(User.name) private userModel: Model<User>,

    private socketGateway: SocketGateway, // Inject SocketGateway
    private restaurentService:RestaurantService,
  ) {}

  private async findOrderById(orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderModel.findById(orderId)
      .populate('client')
      .populate('items.menuItem')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }








  async getOrdersForDelivery(delivererId: string) {
    if (!Types.ObjectId.isValid(delivererId)) {
      throw new BadRequestException('Invalid deliverer ID');
    }
    const orders = await this.orderModel.find({ assignedTo: delivererId, status: OrderStatus.READY })
      .populate('client')
      .populate('items.menuItem')
      .exec();

    if (!orders || orders.length === 0) {
      throw new NotFoundException('No orders available for delivery');
    }

    return orders;
  }

  async getDeliveryHistory(delivererId: string) {
    if (!Types.ObjectId.isValid(delivererId)) {
      throw new BadRequestException('Invalid deliverer ID');
    }
    const orders = await this.orderModel.find({ assignedTo: delivererId, status: OrderStatus.DELIVERED })
      .populate('client')
      .populate('items.menuItem')
      .sort({ createdAt: -1 })
      .exec();

    if (!orders || orders.length === 0) {
      throw new NotFoundException('No delivery history found');
    }

    return orders;
  }

  // Assign order to a deliverer and notify them
  async assignOrderToDeliverer(orderId: string, delivererId: string) {
    
        const order = await this.findOrderById(orderId);
    if (order.status !== OrderStatus.READY) {
      throw new BadRequestException('Order is not ready for delivery');
    }
    order.assignedTo = delivererId;
    await order.save(); // Make sure this is successful

    // Notify the deliverer
    this.socketGateway.notifyDeliverer(delivererId, order);
        return order;
  }



    async getAllDrivers() {
        const drivers = await this.userModel.find({ role: 'livreur' }).exec();
        if (!drivers || drivers.length === 0) {
        throw new NotFoundException('No drivers found');
        }
        return drivers;
    }

 
}




