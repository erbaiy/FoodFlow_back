import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MenuItemModule } from '../menu-item/menu-item.module';
import { AuthModule } from '../auth/auth.module';
import { Restaurant, RestaurantSchema } from '../resto/schema/resto.schema';
import { SuperAdminRestaurentController } from './controller/restauren.controller';
import { SuperAdminRestaurentService } from './services/restaurent.service';
import { User, UserSchema } from '../auth/schema/user.schema';
import { DeliveryDriverController } from './controller/delivry-driver.controller';
import { DeliveryDriverService } from './services/delivy-driver.service';
import { RestaurantService } from '../resto/resto.service';
import { RestaurationModule } from '../resto/resto.module';

@Module({
  imports: [
  MongooseModule.forFeature([
      {
        name: Restaurant.name,
        schema: RestaurantSchema,
     
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    MenuItemModule,
    forwardRef(() => AuthModule), // Use forwardRef here too
    forwardRef(() => RestaurationModule),

  ],
  controllers: [SuperAdminRestaurentController,DeliveryDriverController,],
  providers: [ SuperAdminRestaurentService,DeliveryDriverService],
  exports: [ SuperAdminRestaurentService],
})
export class SuperAdminModule {}
