
// user.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { pick } from 'lodash';
import { User, UserDocument } from '../schema/user.schema';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>
    ) {}

    async registerUser(userData: any, userRole: string): Promise<{success: boolean, user?: UserDocument, error?: string}> {
        try {
            const emailExists = await this.userModel.findOne({ email: userData.email });
            if (emailExists) {
                return { success: false, error: 'Email already exists' };
            }

            const user = await this.userModel.create({
                ...pick(userData, ['fullName', 'email', 'password', 'phoneNumber', 'address']),
                role: userRole,
                loginHistory: {
                    history: [],
                    lastLogin: new Date()
                }
            });

            return { success: true, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async findByIdAndUpdate(id: string, updateData: any): Promise<{success: boolean, user?: UserDocument, error?: string}> {

        try {
            const user = await this.userModel.findByIdAndUpdate(id, updateData, { new: true });
            if (!user) {
                return { success: false, error: 'User not found' };
            }
            return { success: true, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async findByEmail(email: string): Promise<UserDocument> {
        return this.userModel.findOne({ email });
    }
}