import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { OrderStatus, UpdateOrderStatusDto } from '../commands/dto/update-order-status.dto';
import { OrderService } from '../commands/order.service';
import { CreateOrderDto } from '../commands/dto/create-order-status.dto';

@Controller('driver')
export class DriverController {
    constructor(private readonly orderService: OrderService) {}
    
      
    
    @Get('deliverer/:id/history')
    @ApiOperation({ summary: 'Get delivery history for a deliverer' })
    @ApiParam({ name: 'id', description: 'Deliverer ID' })
    async getDeliveryHistory(@Param('id') delivererId: string) {
      return await this.orderService.getDeliveryHistory(delivererId);
    }

    // get asing order to deliverer
    @Get('deliverer/:id/orders')
    @ApiOperation({ summary: 'Get orders assigned to a deliverer' })
    @ApiParam({ name: 'id', description: 'Deliverer ID' })
    async getOrdersForDelivery(@Param('id') delivererId: string) {
      return await this.orderService.getOrdersForDelivery(delivererId);
    }

    @Put('orders/:id/confirm')
    @ApiOperation({ summary: 'Confirm an order' })
    @ApiParam({ name: 'id', description: 'Order ID' })
    async confirmOrder(@Param('id') orderId: string) {
      return await this.orderService.confirmDelivery(orderId);
    }


    
}