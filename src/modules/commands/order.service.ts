import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ObjectId } from 'mongoose';
import { Order } from './schema/order.schema';
import { OrderStatus, UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreateOrderDto } from './dto/create-order-status.dto';
import { SocketGateway } from '../socket/socket.gateway';
import { RestaurantService } from '../resto/resto.service';
import { Restaurant } from '../resto/schema/resto.schema';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Restaurant.name) private restaurentModel: Model<Restaurant>,
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

  private async changeOrderStatus(orderId: string, status: OrderStatus) {
    const order = await this.findOrderById(orderId);
    order.status = status;
    return order.save();
  }

  async getAllOrders(managerId: string) {
  if (!Types.ObjectId.isValid(managerId)) {
    throw new BadRequestException('Invalid restaurant ID');
  }
  const resto = await this.restaurentModel.find({manager: managerId});
  if (!resto || resto.length === 0) {
    throw new NotFoundException('no resto for auth manager')
  }
  
  const orders = await this.orderModel.find({ restaurant: resto[0]._id })
    .populate('client')
    .populate({
      path: 'items.menuItem',
      select: '_id name price'  // Explicitly selecting the fields we want
    })
    .sort({ createdAt: -1 })
    .exec();

  if (!orders || orders.length === 0) {
    throw new NotFoundException('No orders found');
  }

  return orders;
}
// async getAllOrders(managerId: string) {
//   if (!Types.ObjectId.isValid(managerId)) {
//     throw new BadRequestException('Invalid restaurant ID');
//   }
  
//   const resto = await this.restaurentModel.find({manager: managerId});
//   if (!resto || resto.length === 0) {
//     throw new NotFoundException('no resto for auth manager')
//   }
  
//   const orders = await this.orderModel.find({ restaurant: resto[0]._id })
//     .populate('client')
//     .populate({
//       path: 'items.menuItem',
//       model: 'MenuItem',
//       select: 'name _id'  // Explicitly selecting the fields we want
//     })
//     .sort({ createdAt: -1 })
//     .exec();

//   if (!orders || orders.length === 0) {
//     throw new NotFoundException('No orders found');
//   }

//   return orders;
// }

  async getOrderById(orderId: string) {
    return this.findOrderById(orderId);
  }

  async createOrder(createOrderDto: CreateOrderDto) {
    try {
      const newOrder = new this.orderModel({
        ...createOrderDto,
        status: OrderStatus.PENDING,
      });

      const savedOrder = await newOrder.save();
      const Order= await this.findOrderById(savedOrder._id.toString());
      this.socketGateway.notifyRestaurantsManager(createOrderDto.restaurant, Order);
      return savedOrder;
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException('Error creating order');
    }
  }

  async updateOrderStatus(updateOrderStatusDto: UpdateOrderStatusDto) {
    const { orderId, newStatus } = updateOrderStatusDto;

    if (!newStatus) {
      throw new BadRequestException('Status is required');
    }

    return this.changeOrderStatus(orderId, newStatus);
  }

  async cancelOrder(orderId: string) {
    return this.changeOrderStatus(orderId, OrderStatus.CANCELLED);
  }

  async markOrderAsReady(orderId: string) {
    return this.changeOrderStatus(orderId, OrderStatus.READY);
  }

  async getOrdersByStatus(status: OrderStatus, restaurantId?: string) {
    try {
      const query = restaurantId
        ? { status, restaurant: restaurantId }
        : { status };

      const orders = await this.orderModel.find(query)
        .populate('client')
        .populate('items.menuItem')
        .sort({ createdAt: -1 })
        .exec();

      if (!orders || orders.length === 0) {
        throw new NotFoundException(`No orders found with status: ${status}`);
      }

      return orders;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error retrieving orders by status');
    }
  }

  async getOrdersForDelivery(delivererId: string) {
    if (!Types.ObjectId.isValid(delivererId)) {
      throw new BadRequestException('Invalid deliverer ID');
    }
    const orders = await this.orderModel.find({ assignedTo: delivererId, status: OrderStatus.READY })
      .populate('client')
      .populate('items.menuItem')
      .exec();

    // if (!orders || orders.length === 0) {
    //   throw new NotFoundException('No orders available for delivery');
    // }

    return orders?orders:[];
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

  // Confirm delivery and notify the client
  async confirmDelivery(orderId: string) {
  const order = await this.findOrderById(orderId);
  
  if (order.status !== OrderStatus.READY) {
    throw new BadRequestException('Order is not ready for delivery');
  }

  const resto = await this.restaurentModel.findById(order.restaurant).populate<{ manager: { _id: Types.ObjectId } }>('manager');
  if(!resto){
    throw new BadRequestException('resto not found');
  } 
  const managerId = resto.manager._id;

  order.status = OrderStatus.DELIVERED;
  await order.save();

  // Notify the restaurant manager about delivery
  this.socketGateway.notifyRestaurantsManagerDelivered(managerId, order);
  
  return order;
}


}












// import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model, Types } from 'mongoose';
// import { Order } from './schema/order.schema';
// import { OrderStatus, UpdateOrderStatusDto } from './dto/update-order-status.dto';
// import { CreateOrderDto } from './dto/create-order-status.dto';
// import { SocketGateway } from '../socket/socket.gateway';

// @Injectable()
// export class OrderService {
//   constructor(
//     @InjectModel(Order.name) private orderModel: Model<Order>,
//     private socketGateway: SocketGateway, // Inject SocketGateway
//   ) {}

//   private async findOrderById(orderId: string) {
//     if (!Types.ObjectId.isValid(orderId)) {
//       throw new BadRequestException('Invalid order ID');
//     }

//     const order = await this.orderModel.findById(orderId)
//       .populate('client')
//       .populate('items.menuItem')
//       .exec();

//     if (!order) {
//       throw new NotFoundException('Order not found');
//     }
//     return order;
//   }

//   private async changeOrderStatus(orderId: string, status: OrderStatus) {
//     const order = await this.findOrderById(orderId);
//     order.status = status;
//     return order.save();
//   }

//   async getAllOrders(restaurantId: string) {
//     if (!Types.ObjectId.isValid(restaurantId)) {
//       throw new BadRequestException('Invalid restaurant ID');
//     }

//     const orders = await this.orderModel.find({ restaurant: restaurantId })
//       .populate('client')
//       .populate('items.menuItem')
//       .sort({ createdAt: -1 })
//       .exec();

//     if (!orders || orders.length === 0) {
//       throw new NotFoundException('No orders found');
//     }

//     return orders;
//   }

//   async getOrderById(orderId: string) {
//     return this.findOrderById(orderId);
//   }

//   async createOrder(createOrderDto: CreateOrderDto) {
//     try {
//       const newOrder = new this.orderModel({
//         ...createOrderDto,
//         status: OrderStatus.PENDING,
//       });

//       const savedOrder = await newOrder.save();
//       return await this.findOrderById(savedOrder._id.toString());
//     } catch (error) {
//       if (error.name === 'ValidationError') {
//         throw new BadRequestException(error.message);
//       }
//       throw new InternalServerErrorException('Error creating order');
//     }
//   }

//   async updateOrderStatus(updateOrderStatusDto: UpdateOrderStatusDto) {
//     const { orderId, newStatus } = updateOrderStatusDto;

//     if (!newStatus) {
//       throw new BadRequestException('Status is required');
//     }

//     return this.changeOrderStatus(orderId, newStatus);
//   }

//   async cancelOrder(orderId: string) {
//     return this.changeOrderStatus(orderId, OrderStatus.CANCELLED);
//   }

//   async markOrderAsReady(orderId: string) {
//     return this.changeOrderStatus(orderId, OrderStatus.READY);
//   }

//   async getOrdersByStatus(status: OrderStatus, restaurantId?: string) {
//     try {
//       const query = restaurantId
//         ? { status, restaurant: restaurantId }
//         : { status };

//       const orders = await this.orderModel.find(query)
//         .populate('client')
//         .populate('items.menuItem')
//         .sort({ createdAt: -1 })
//         .exec();

//       if (!orders || orders.length === 0) {
//         throw new NotFoundException(`No orders found with status: ${status}`);
//       }

//       return orders;
//     } catch (error) {
//       if (error instanceof NotFoundException) {
//         throw error;
//       }
//       throw new InternalServerErrorException('Error retrieving orders by status');
//     }
//   }

//   async getOrdersForDelivery(delivererId: string) {
//     if (!Types.ObjectId.isValid(delivererId)) {
//       throw new BadRequestException('Invalid deliverer ID');
//     }
//     const orders = await this.orderModel.find({ assignedTo: delivererId, status: OrderStatus.READY })
//       .populate('client')
//       .populate('items.menuItem')
//       .exec();

//     if (!orders || orders.length === 0) {
//       throw new NotFoundException('No orders available for delivery');
//     }

//     return orders;
//   }

//   async getDeliveryHistory(delivererId: string) {
//     if (!Types.ObjectId.isValid(delivererId)) {
//       throw new BadRequestException('Invalid deliverer ID');
//     }
//     const orders = await this.orderModel.find({ assignedTo: delivererId, status: OrderStatus.DELIVERED })
//       .populate('client')
//       .populate('items.menuItem')
//       .sort({ createdAt: -1 })
//       .exec();

//     if (!orders || orders.length === 0) {
//       throw new NotFoundException('No delivery history found');
//     }

//     return orders;
//   }

//   // Assign order to a deliverer and notify them
//   async assignOrderToDeliverer(orderId: string, delivererId: string) {
//     const order = await this.findOrderById(orderId);
//     if (order.status !== OrderStatus.READY) {
//       throw new BadRequestException('Order is not ready for delivery');
//     }
//     order.assignedTo = delivererId;
//     await order.save();

//     // Notify the deliverer
//     this.socketGateway.notifyDeliverer(delivererId, order);
//     return order;
//   }

//   // Confirm delivery and notify the client
//   async confirmDelivery(orderId: string) {
//     const order = await this.findOrderById(orderId);
//     if (order.status !== OrderStatus.READY) {
//       throw new BadRequestException('Order is not ready for delivery');
//     }
//     order.status = OrderStatus.DELIVERED;
//     await order.save();

//     // Notify the client
//     this.socketGateway.notifyClient(order.client.toString(), order);
//     return order;
//   }
// }