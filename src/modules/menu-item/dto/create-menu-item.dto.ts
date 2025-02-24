import { IsString, IsNumber, IsEnum, IsOptional, Length, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MENU_ITEM_CATEGORIES, MenuItemCategory } from '../constants/menu-item.constants';

export class CreateMenuItemDto {
    @ApiProperty({ 
        example: 'Margherita Pizza',
        description: 'Name of the menu item'
    })
    @IsString()
    @Length(2, 50)
    @Transform(({ value }) => value?.trim())
    name: string;

    @ApiProperty({ 
        example: 'Classic Italian pizza with tomatoes and mozzarella',
        description: 'Detailed description of the menu item'
    })
    @IsString()
    @Length(10, 500)
    @Transform(({ value }) => value?.trim())
    description: string;

    @ApiProperty({ 
        example: 12.99,
        description: 'Price of the menu item'
    })
    @IsNumber()
    @Min(0)
    @Transform(({ value }) => Number(value))
    price: number;

    @ApiPropertyOptional({ 
        type: 'string',
        format: 'binary',
        description: 'Image file for the menu item'
    })
    @IsOptional()
    image?: any;

    @ApiProperty({ 
        enum: MENU_ITEM_CATEGORIES,
        description: 'Category of the menu item'
    })
    @IsEnum(MENU_ITEM_CATEGORIES)
    category: MenuItemCategory;
}
