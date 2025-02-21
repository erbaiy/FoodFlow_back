import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({
    timestamps: true,
    // Add collation for case-insensitive unique indexes
    collation: { locale: 'en', strength: 2 }
})
export class Restaurant {
    @Prop({ 
        required: [true, 'Name is required'],
        unique: true,
        trim: true, // Remove whitespace
        index: true // Index for better query performance
    })
    name: string;

    @Prop({ 
        required: false,
        trim: true
    })
    cuisineType: string;

    @Prop({ 
        required: [true, 'Address is required'],
        unique: true,
        trim: true,
        index: true
    })
    address: string;

    @Prop({ 
        required: [true, 'Location is required'],
        trim: true
    })
    location: string;

    @Prop({
        validate: {
            validator: function(v: string) {
                if (!v) return true; // Allow empty value
                const urlPattern = new RegExp(
                    '^(https?:\\/\\/)?'+ // protocol
                    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
                    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
                    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
                    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
                    '(\\#[-a-z\\d_]*)?$','i' // fragment locator
                );
                return urlPattern.test(v);
            },
            message: props => `${props.value} is not a valid URL for banner image`
        }
    })
    banner: string;

    @Prop({
        validate: {
            validator: function(v: string) {
                if (!v) return true; // Allow empty value
                const urlPattern = new RegExp(
                    '^(https?:\\/\\/)?'+ // protocol
                    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
                    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
                    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
                    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
                    '(\\#[-a-z\\d_]*)?$','i' // fragment locator
                );
                return urlPattern.test(v);
            },
            message: props => `${props.value} is not a valid URL for logo image`
        }
    })
    logo: string;

    @Prop({ 
        type: MongooseSchema.Types.ObjectId, 
        ref: 'User', 
        required: [true, 'Manager is required'],
        index: true
    })
    manager: MongooseSchema.Types.ObjectId;

    @Prop({ 
        default: false,
        required: true,
        index: true
    })
    isApproved: boolean;

    @Prop({ 
        type: [{ type: MongooseSchema.Types.ObjectId, ref: 'MenuItem' }],
        validate: {
            validator: function(v: MongooseSchema.Types.ObjectId[]) {
                return Array.isArray(v);
            },
            message: () => 'Menu must be an array of menu items'
        },
        default: []
    })
    menu: MongooseSchema.Types.ObjectId[];
}

export type RestaurantDocument = Restaurant & Document;

export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);

// Create compound indexes if needed
RestaurantSchema.index({ name: 1, location: 1 }, { unique: true });

// Add pre-save middleware for additional validation
RestaurantSchema.pre('save', async function(next) {
    try {
        const restaurant = this;
        
        // Convert name and address to lowercase for consistency
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

// Add custom error handling for duplicate key errors
RestaurantSchema.post('save', function(error, doc, next) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        next(new Error(`A restaurant with this ${field} already exists`));
    } else {
        next(error);
    }
});

// Add the same error handling for updates
RestaurantSchema.post('findOneAndUpdate', function(error, doc, next) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        next(new Error(`A restaurant with this ${field} already exists`));
    } else {
        next(error);
    }
});
