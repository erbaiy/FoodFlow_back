
// user.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { pick } from 'lodash';
import { User, UserDocument } from '../schema/user.schema';
import { Restaurant } from 'src/modules/resto/schema/resto.schema';
import { RegisterDto } from '../dto/auth.dto';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        // @InjectModel(Restaurant.name) private restoModel: Model<RestaurantDocument>
    ) {}

    async registerUser(
        userData: RegisterDto,
      ): Promise<{ success: boolean; error?: string; user?: UserDocument }> {
        try {
          // Check if the user already exists
          const existingUser = await this.userModel
            .findOne({ email: userData.email })
            .exec();
      
          if (existingUser) {
            return {
              success: false,
              error: 'User with this email already exists',
            };
          }
      
          // Create and save the new user
          const user = new this.userModel(userData);
          await user.save();
      
          return {
            success: true,
            user,
          };
        } catch (error) {
          console.error('Error in registerUser:', error);
          return {
            success: false,
            error: error.message || 'Error registering user',
          };
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


    async getUsers(): Promise<UserDocument[]> {

        return this.userModel.find();
      } 

    async findUserByID(id: string):Promise<any>
    {
        return this.userModel.findById(id);
    }


      async updateUserRole(id: string, role: string): Promise<{success: boolean, user?: UserDocument, error?: string}> {
    try {
        // Validate role if needed
        const validRoles = ['client', 'livreur', 'gestionnaire', 'super_admin']; // Add your valid roles here
        if (!validRoles.includes(role)) {
            return { success: false, error: 'Invalid role' };
        }

        const user = await this.userModel.findByIdAndUpdate(
            id, 
            { role }, 
            { new: true }
        );

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async deleteUser(id: string): Promise<{success: boolean, message?: string, error?: string}> {
    try {
        const result = await this.userModel.findByIdAndDelete(id);
        
        if (!result) {
            return { success: false, error: 'User not found' };
        }
        
        return { success: true, message: 'User deleted successfully' };
    } catch (error) {
        return { success: false, error: error.message };
    }   
} 


}
