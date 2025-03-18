
import { IsMongoId, IsArray, IsNumber, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from './update-order-status.dto';

class OrderItemDto {
  @IsMongoId()
  menuItem: string;

  @IsNumber()
  quantity: number;
}

export class CreateOrderDto {
  @IsMongoId()
  restaurant: string;

  @IsMongoId() 
  client: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];


}