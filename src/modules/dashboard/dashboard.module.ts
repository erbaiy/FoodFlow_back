import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../commands/schema/order.schema';
import { Restaurant, RestaurantSchema } from '../resto/schema/resto.schema';
import { User, UserSchema } from '../auth/schema/user.schema';
import { RestaurationModule } from '../resto/resto.module';
import { AuthModule } from '../auth/auth.module';
import { OrderModule } from '../commands/order.module';
import { SuperAdminDashboardService } from './services/supper-admin-dashboard.service';
import { SuperAdminDashboardController } from './controllers/supper-admin-dashboard.controller';

@Module({
  imports: [
  MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: User.name, schema: UserSchema},
    ]),
    RestaurationModule,
    AuthModule,
    OrderModule,
  ],
  controllers: [SuperAdminDashboardController],
  providers: [SuperAdminDashboardService],
})
export class DashboardModule {}
