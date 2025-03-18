import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CreateOrderDto } from 'src/modules/commands/dto/create-order-status.dto';
import {
  OrderStatus,
  UpdateOrderStatusDto,
} from 'src/modules/commands/dto/update-order-status.dto';
import { OrderService } from 'src/modules/commands/order.service';
import { OrderManagerService } from '../service/order-manager.service';

@ApiTags('Orders')
@Controller('orders-manager')
export class OrderManagerController {
  constructor(private readonly orderService: OrderService,
              private readonly orderManagerService: OrderManagerService
              ,
  ) {}
 
  // get all order of resto by the authentificate gistionair
  @Get('restaurant-manager/:id')
  @ApiOperation({ summary: 'Get all orders for a restaurant' })
  @ApiParam({ name: 'id', description: 'manager  ID' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiResponse({ status: 404, description: 'No orders found' })
  async getAllOrders(@Param('id') managerId: string) {
    return await this.orderService.getAllOrders(managerId);
  }


  

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async getOrderById(@Param('id') orderId: string) {
    return await this.orderService.getOrderById(orderId);
  }


  @Patch('status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiBody({ type: UpdateOrderStatusDto })
  async updateOrderStatus(@Body() updateOrderStatusDto: UpdateOrderStatusDto) {
    return await this.orderService.updateOrderStatus(updateOrderStatusDto);
  }

  

  @Get('filer-by-status/:status')
  @ApiOperation({ summary: 'Get orders by status' })
  @ApiParam({ name: 'status', enum: OrderStatus })
  async getOrdersByStatus(
    @Param('status') status: OrderStatus,
    @Query('restaurantId') restaurantId?: string,
  ) {
    return await this.orderService.getOrdersByStatus(status, restaurantId);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign order to a deliverer' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({ schema: { properties: { delivererId: { type: 'string' } } } })
  async assignOrderToDeliverer(
    @Param('id') orderId: string,
    @Body('delivererId') delivererId: string,
  ) {
    return await this.orderService.assignOrderToDeliverer(orderId, delivererId);
  }
  // get all  drivers 
  @Get('get/driver')
  @ApiOperation({ summary: 'Get all drivers' })
  async getAllDrivers() {
    return await this.orderManagerService.getAllDrivers();

  }



  @Get('deliverer/:id/history')
  @ApiOperation({ summary: 'Get delivery history for a deliverer' })
  @ApiParam({ name: 'id', description: 'Deliverer ID' })
  async getDeliveryHistory(@Param('id') delivererId: string) {
    return await this.orderService.getDeliveryHistory(delivererId);
  }


  
}
