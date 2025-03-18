// restaurant.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true, collation: { locale: 'en', strength: 2 } })
export class Restaurant {
  @Prop({ required: [true, 'Name is required'], unique: true, trim: true, index: true })
  name: string;

  @Prop({ required: false, trim: true })
  cuisineType: string;

  @Prop({ required: [true, 'Address is required'], unique: true, trim: true, index: true })
  address: string;

  @Prop({ required: [true, 'Location is required'], trim: true })
  location: string;

  @Prop()
  banner: string;

  @Prop()
  logo: string;

  @Prop()
  cover: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: [true, 'Manager is required'], index: true })
  manager: MongooseSchema.Types.ObjectId;

  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: [false, 'driver is not required'], index: true })
  driver: MongooseSchema.Types.ObjectId;

  @Prop({ default: false, required: true, index: true })
  isApproved: boolean;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'MenuItem' }], default: [] })
  menu: MongooseSchema.Types.ObjectId[];



  @Prop({ default: 0, min: 0, max: 5 })
  rating: number;
}

export type RestaurantDocument = Restaurant & Document;

export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);

RestaurantSchema.index({ name: 1, location: 1 }, { unique: true });

RestaurantSchema.pre('save', async function (next) {
  try {
    const restaurant = this;

    if (restaurant.isModified('name')) {
      restaurant.name = restaurant.name.toLowerCase();
    }
    if (restaurant.isModified('address')) {
      restaurant.address = restaurant.address.toLowerCase();
    }

    next();
  } catch (error) {
    next(error);
  }
});

RestaurantSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    next(new Error(`A restaurant with this ${field} already exists`));
  } else {
    next(error);
  }
});

RestaurantSchema.post('findOneAndUpdate', function (error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    next(new Error(`A restaurant with this ${field} already exists`));
  } else {
    next(error);
  }
});