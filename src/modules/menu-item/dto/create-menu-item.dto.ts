// src/modules/menu-item/dto/create-menu-item.dto.ts
import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, Min, IsUrl } from 'class-validator';

export class CreateMenuItemDto {
    @IsString()
    name: string;

    @IsString()
    description: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsUrl()
    @IsOptional()
    image?: string;

    @IsBoolean()
    @IsOptional()
    isAvailable?: boolean;

    @IsEnum(['appetizer', 'main', 'dessert', 'beverage'])
    category: string;
}
