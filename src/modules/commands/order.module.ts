import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order, OrderSchema } from './schema/order.schema';
import { SocketModule } from '../socket/socket.module';
import { RestaurationModule } from '../resto/resto.module';
import { ClientController } from '../client/client.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    SocketModule,
    RestaurationModule,
  ],
  controllers: [OrderController], // Remove ClientController from here
  providers: [OrderService],
  exports: [OrderService, MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }])],
})
export class OrderModule {}