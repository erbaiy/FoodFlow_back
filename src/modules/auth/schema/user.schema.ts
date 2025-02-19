// user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { LoginHistory, UserMethods } from '../user.interface';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: [true, 'Full name is required'] })
  fullName: string;

  @Prop({
    required: [true, 'Email is required'],
    unique: true,
    validate: {
      validator: function(v: string) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: (props: any) => `${props.value} is not a valid email address!`
    }
  })
  email: string;

  @Prop({
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    validate: {
      validator: function(v: string) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(v);
      },
      message: () => 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number'
    }
  })
  password: string;

  @Prop({
    type: String,
    enum: ['client', 'livreur', 'gestionnaire', 'super_admin'],
    default: 'client',
    required: true
  })
  role: string;

  @Prop({ required: [true, 'Address is required'] })
  address: string;

  @Prop({
    required: [true, 'Phone number is required'],
    unique: true,
    validate: {
      validator: function(v: string) {
        return /^\+\d{1,3}\d{4,14}$/.test(v);
      },
      message: (props: any) => `${props.value} is not a valid phone number!`
    }
  })
  phoneNumber: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({
    type: {
      history: [{ fingerprint: String, location: String }],
      lastLogin: { type: Date, default: Date.now }
    }
  })
  loginHistory: {
    history: LoginHistory[];
    lastLogin: Date;
  };
}

export type UserDocument = User & Document & UserMethods;

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};