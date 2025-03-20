import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { RestaurantController } from "./resto.controller";
import { RestaurantService } from "./resto.service";
import { Restaurant, RestaurantSchema } from "./schema/resto.schema";
import { MenuItemModule } from "../menu-item/menu-item.module";
import { AuthModule } from "../auth/auth.module";

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: Restaurant.name,
                schema: RestaurantSchema
            }
        ]),
        MenuItemModule,
        forwardRef(() => AuthModule) 
    ],
    controllers: [RestaurantController],
    providers: [RestaurantService],
    exports: [RestaurantService, MongooseModule]
})
export class RestaurationModule {}





