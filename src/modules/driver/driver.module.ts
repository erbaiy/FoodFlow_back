import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RestaurationModule } from '../resto/resto.module';
import { MenuItemModule } from '../menu-item/menu-item.module';
import { OrderModule } from '../commands/order.module';
import { SocketModule } from '../socket/socket.module';
import { RestaurantManagerController } from '../resto-manager/controller/restaurant-manager.controller';
import { MenuItemManagerController } from '../resto-manager/controller/menu-manager.controller';
import { OrderManagerController } from '../resto-manager/controller/order-manager.controller';
import { OrderManagerService } from '../resto-manager/service/order-manager.service';
import { RestaurantManagerService } from '../resto-manager/service/restaurant-manager.service';
import { DriverController } from './driver.controller';


@Module({
  imports: [
    AuthModule,
    RestaurationModule,     // Add this to provide RestaurantService
    MenuItemModule,  // Add this to provide MenuItemService
    OrderModule,
    SocketModule
  ],
  controllers: [RestaurantManagerController,MenuItemManagerController,OrderManagerController,DriverController],
  providers: [RestaurantManagerService,OrderManagerService],
  exports: [],
})
export class DriverModule {}