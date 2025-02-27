import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { OrderStatus } from '../dto/update-order-status.dto';

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Restaurant', required: true })
  restaurant: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  client: MongooseSchema.Types.ObjectId;

  @Prop([{
    menuItem: { type: MongooseSchema.Types.ObjectId, ref: 'MenuItem' },
    quantity: { type: Number, required: true }
  }])
  items: Array<{ menuItem: MongooseSchema.Types.ObjectId; quantity: number }>;

  @Prop({ 
    type: String, 
    enum: OrderStatus,
    default: OrderStatus.PENDING 
    })
  status: OrderStatus;


  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' }) // 'User' est l'entité du livreur
assignedTo: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
