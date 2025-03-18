import { MongooseModule } from '@nestjs/mongoose';

import { SocketModule } from '../socket/socket.module';
import { RestaurationModule } from '../resto/resto.module';
import { Order, OrderSchema } from '../commands/schema/order.schema';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { OrderModule } from '../commands/order.module';

import { forwardRef, Module } from '@nestjs/common';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    SocketModule,
    RestaurationModule,
    forwardRef(() => OrderModule), // Use forwardRef here
  ],
  controllers: [ClientController],
  providers: [ClientService],
  exports: [ClientService], // Export if needed by OrderModule
})
export class ClientModule {}