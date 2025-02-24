// create-restaurant.dto.ts
import { IsString, IsBoolean, IsArray, IsOptional, IsUrl, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { ObjectId } from 'mongoose';

// update-restaurant.dto.ts
export default class UpdateRestaurantDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    cuisineType?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    location?: string;

    @IsUrl()
    @IsOptional()
    banner?: string;

    @IsUrl()
    @IsOptional()
    logo?: string;

    @IsMongoId()
    @IsOptional()
    manager?: ObjectId;

    @IsBoolean()
    @IsOptional()
    isApproved?: boolean;

    @IsArray()
    @IsMongoId({ each: true })
    @IsOptional()
    menu?: ObjectId[];
}
