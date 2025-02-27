// src/modules/menu-item/menu-item.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { MenuItemController } from './menu-item.controller';
import { MenuItemService } from './menu-item.service';
import { MenuItem, MenuItemSchema } from './schema/menu-item.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { 
                name: MenuItem.name, 
                schema: MenuItemSchema 
            }
        ]),
    ],
    controllers: [MenuItemController],
    providers: [MenuItemService],
    exports: [MongooseModule]
})
export class MenuItemModule {}
