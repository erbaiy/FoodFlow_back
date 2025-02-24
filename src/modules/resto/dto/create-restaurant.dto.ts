// create-restaurant.dto.ts
import { IsString, IsBoolean, IsArray, IsOptional, IsUrl, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { ObjectId } from 'mongoose';

export default class CreateRestaurantDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    cuisineType?: string;

    @IsString()
    address: string;

    @IsString()
    location: string;

    @IsUrl()
    @IsOptional()
    banner?: string;

    @IsUrl()
    @IsOptional()
    logo?: string;

    @IsMongoId()
    manager: string;

    @IsBoolean()
    @IsOptional()
    isApproved?: boolean;

    @IsArray()
    @IsMongoId({ each: true })
    @IsOptional()
    menu?: ObjectId[];
}
