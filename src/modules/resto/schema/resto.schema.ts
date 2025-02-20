import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as bcrypt from 'bcryptjs';

@Schema({timestamps:true})
export class Restaurant {
    @Prop({ 
        required: [true, 'Name is required']
    })
    name: string;

    @Prop({ 
        required:false 
    })
    cuisineType: string;

    @Prop({ 
        required: [true, 'Address is required']
    })
    address: String;

    @Prop({ 
        required: [true, 'Location is required']
    })
    location: string;

    @Prop({
        validate: {
            validator: function(v: string) {
                return v ? true : false;
            },
            message: () => 'Banner image URL is invalid'
        }
    })
    banner: string;

    @Prop({
        validate: {
            validator: function(v: string) {
                return v ? true : false;
            },
            message: () => 'Logo image URL is invalid'
        }
    })
    logo: string;

    @Prop({ 
        type: MongooseSchema.Types.ObjectId, 
        ref: 'User', 
        required: [true, 'Manager is required']
    })
    manager: MongooseSchema.Types.ObjectId;

    @Prop({ 
        default: false,
        required: true
    })
    isApproved: boolean;

    @Prop({ 
        type: [{ type: MongooseSchema.Types.ObjectId, ref: 'MenuItem' }],
        validate: {
            validator: function(v: MongooseSchema.Types.ObjectId[]) {
                return Array.isArray(v);
            },
            message: () => 'Menu must be an array of menu items'
        }
    })
    menu: MongooseSchema.Types.ObjectId[];
}

export type RestaurantDocument = Restaurant & Document;

export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);

RestaurantSchema.pre('save', async function(next) {
    // Add any pre-save hooks here if needed
    next();
});
