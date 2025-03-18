import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RestaurantManagerController } from './controller/restaurant-manager.controller';
import { MenuItemModule } from 'src/modules/menu-item/menu-item.module'; // Import the module containing MenuItemService
import { RestaurationModule } from '../resto/resto.module';
import { RestaurantManagerService } from './service/restaurant-manager.service';
import { MenuItemManagerController } from './controller/menu-manager.controller';
import { OrderManagerController } from './controller/order-manager.controller';
import { OrderModule } from '../commands/order.module';
import { SocketModule } from '../socket/socket.module';
import { Order } from '../commands/schema/order.schema';
import { OrderManagerService } from './service/order-manager.service';

@Module({
  imports: [
    AuthModule,
    RestaurationModule,     // Add this to provide RestaurantService
    MenuItemModule,  // Add this to provide MenuItemService
    OrderModule,
    SocketModule
  ],
  controllers: [RestaurantManagerController,MenuItemManagerController,OrderManagerController],
  providers: [RestaurantManagerService,OrderManagerService],
  exports: [],
})
export class ManagerModule {}