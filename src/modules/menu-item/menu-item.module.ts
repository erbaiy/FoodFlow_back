// src/modules/menu-item/menu-item.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MenuItem, MenuItemSchema } from './schema/menu-item.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { 
                name: MenuItem.name, 
                schema: MenuItemSchema 
            }
        ])
    ],
    exports: [MongooseModule] // Export this so other modules can use it
})
export class MenuItemModule {}
