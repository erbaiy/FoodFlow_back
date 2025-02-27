import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { OrderStatus, UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreateOrderDto } from './dto/create-order-status.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('restaurant/:id')
  @ApiOperation({ summary: 'Get all orders for a restaurant' })
  @ApiParam({ name: 'id', description: 'Restaurant ID' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiResponse({ status: 404, description: 'No orders found' })
  async getAllOrders(@Param('id') restaurantId: string) {
    return await this.orderService.getAllOrders(restaurantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async getOrderById(@Param('id') orderId: string) {
    return await this.orderService.getOrderById(orderId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new order' })
  @ApiBody({ type: CreateOrderDto })
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    return await this.orderService.createOrder(createOrderDto);
  }

  @Patch('status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiBody({ type: UpdateOrderStatusDto })
  async updateOrderStatus(@Body() updateOrderStatusDto: UpdateOrderStatusDto) {
    return await this.orderService.updateOrderStatus(updateOrderStatusDto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async cancelOrder(@Param('id') orderId: string) {
    return await this.orderService.cancelOrder(orderId);
  }

  @Patch(':id/ready')
  @ApiOperation({ summary: 'Mark order as ready' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async markOrderAsReady(@Param('id') orderId: string) {
    return await this.orderService.markOrderAsReady(orderId);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get orders by status' })
  @ApiParam({ name: 'status', enum: OrderStatus })
  async getOrdersByStatus(
    @Param('status') status: OrderStatus,
    @Query('restaurantId') restaurantId?: string
  ) {
    return await this.orderService.getOrdersByStatus(status, restaurantId);
  }

  @Patch(':id/assign')
@ApiOperation({ summary: 'Assign order to a deliverer' })
@ApiParam({ name: 'id', description: 'Order ID' })
@ApiBody({ schema: { properties: { delivererId: { type: 'string' } } }})
async assignOrderToDeliverer(
  @Param('id') orderId: string,
  @Body('delivererId') delivererId: string
) {
  return await this.orderService.assignOrderToDeliverer(orderId, delivererId);
}

@Get('deliverer/:id/history')
@ApiOperation({ summary: 'Get delivery history for a deliverer' })
@ApiParam({ name: 'id', description: 'Deliverer ID' })
async getDeliveryHistory(@Param('id') delivererId: string) {
  return await this.orderService.getDeliveryHistory(delivererId);
}
}
