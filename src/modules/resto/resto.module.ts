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
        forwardRef(() => AuthModule) // Use forwardRef here too
    ],
    controllers: [RestaurantController],
    providers: [RestaurantService],
    exports: [RestaurantService]
})
export class RestaurationModule {}










// import { Module } from "@nestjs/common";
// import { MongooseModule } from "@nestjs/mongoose";
// import { RestaurantController } from "./resto.controller";
// import { RestaurantService } from "./resto.service";
// import { Restaurant, RestaurantSchema } from "./schema/resto.schema";
// import { MenuItemModule } from "../menu-item/menu-item.module";
// import { AuthModule } from "../auth/auth.module"; // Import the AuthModule instead

// @Module({
//     imports: [
//         MongooseModule.forFeature([
//             { 
//                 name: Restaurant.name, 
//                 schema: RestaurantSchema 
//             }
//         ]),
//         MenuItemModule,
//         AuthModule // Import the module that exports UserService
//     ],
//     controllers: [RestaurantController],
//     providers: [RestaurantService],
//     exports: [RestaurantService]
// })
// export class RestaurationModule {}