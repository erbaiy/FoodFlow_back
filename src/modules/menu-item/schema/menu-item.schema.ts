import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { MENU_ITEM_CATEGORIES, MenuItemCategory } from '../constants/menu-item.constants';

@Schema({
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
    collection: 'menuItems',
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})
export class MenuItem {
    @Prop({
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters'],
        unique: true,
        index: true
    })
    name: string;

    @Prop({
        required: [true, 'Description is required'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters'],
        maxlength: [500, 'Description cannot exceed 500 characters']
    })
    description: string;

    @Prop({
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative'],
        type: Number
    })
    price: number;

    @Prop()
    image?: string;

    @Prop({
        required: [true, 'Category is required'],
        enum: {
            values: MENU_ITEM_CATEGORIES,
            message: '{VALUE} is not a valid category'
        },
        index: true
    })
    category: MenuItemCategory;

    @Prop({
        default: true, // Default value for `isAvailable`
        type: Boolean
    })
    isAvailable: boolean;
}

export type MenuItemDocument = MenuItem & Document;
export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);

MenuItemSchema.index({ category: 1, name: 1 });