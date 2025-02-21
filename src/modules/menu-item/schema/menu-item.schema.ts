// src/modules/menu-item/schema/menu-item.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({
    timestamps: true
})
export class MenuItem {
    @Prop({ 
        required: [true, 'Name is required'],
        trim: true
    })
    name: string;

    @Prop({ 
        required: [true, 'Description is required'],
        trim: true
    })
    description: string;

    @Prop({ 
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    })
    price: number;

    @Prop({
        validate: {
            validator: function(v: string) {
                if (!v) return true;
                const urlPattern = new RegExp(
                    '^(https?:\\/\\/)?'+ 
                    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+
                    '((\\d{1,3}\\.){3}\\d{1,3}))'+ 
                    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+
                    '(\\?[;&a-z\\d%_.~+=-]*)?'+
                    '(\\#[-a-z\\d_]*)?$','i'
                );
                return urlPattern.test(v);
            },
            message: props => `${props.value} is not a valid URL for image`
        }
    })
    image: string;

    @Prop({ 
        default: true 
    })
    isAvailable: boolean;

    @Prop({ 
        type: String,
        required: [true, 'Category is required'],
        enum: ['appetizer', 'main', 'dessert', 'beverage']
    })
    category: string;
}

export type MenuItemDocument = MenuItem & Document;
export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);
