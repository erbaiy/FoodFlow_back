import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum OrderStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export class UpdateOrderStatusDto {
  @ApiProperty({ description: 'Order ID' })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiProperty({ 
    description: 'New status for the order',
    enum: OrderStatus
  })
  @IsNotEmpty()
  @IsEnum(OrderStatus)
  newStatus: OrderStatus;
}
