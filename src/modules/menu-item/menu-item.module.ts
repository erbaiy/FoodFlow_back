// src/modules/menu-item/menu-item.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { MenuItemController } from './menu-item.controller';
import { MenuItemService } from './menu-item.service';
import { MenuItem, MenuItemSchema } from './schema/menu-item.schema';
import { Restaurant, RestaurantSchema } from '../resto/schema/resto.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { 
                name: MenuItem.name, 
                schema: MenuItemSchema 
            },
            {
                name: Restaurant.name, 
                schema: RestaurantSchema 
            },
        ]),
    ],
    controllers: [MenuItemController],
    providers: [MenuItemService],
    exports: [MongooseModule, MenuItemService],
})
export class MenuItemModule {}
