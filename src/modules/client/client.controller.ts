import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { CreateOrderDto } from '../commands/dto/create-order-status.dto';
import { OrderService } from '../commands/order.service';
import { UpdateOrderStatusDto } from '../commands/dto/update-order-status.dto';
import { ClientService } from './client.service';
import { RestaurantsResponse } from 'src/common/interfaces/restaurants/RestaurantCrudInterface';
import { RestaurantService } from '../resto/resto.service';

@ApiTags('client')
@Controller('client')
export class ClientController {
  constructor(
    private readonly orderService: OrderService,
    private readonly clientService: ClientService,
    private readonly restaurantService: RestaurantService,
  ) {}

  //   get all resto  for client
  @Get("restaurants")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get all restaurants' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Restaurants fetched successfully',
    })
    async getAllRestaurants(): Promise<RestaurantsResponse> {
      return await this.restaurantService.getAllRestaurants();
    }
  @Post()
  @ApiOperation({ summary: 'Create new order' })
  @ApiBody({ type: CreateOrderDto })
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    return await this.orderService.createOrder(createOrderDto);
  }
  // get list of order by the client
  @Get('orders/:id')
  @ApiOperation({ summary: 'Get orders by client ID' })
  @ApiParam({ name: 'id', description: 'Client ID' })
  async getOrdersByClient(@Param('id') clientId: string) {
    return await this.clientService.getMyOrders(clientId);
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
}
