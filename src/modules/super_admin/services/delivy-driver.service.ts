import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "src/modules/auth/schema/user.schema";
import { UserService } from "src/modules/auth/services/userService.service";
@Injectable()
export class DeliveryDriverService {

    constructor(  

           @InjectModel(User.name)
            private readonly userModel: Model<User>,
            @Inject(forwardRef(() => UserService))
            private readonly userService: UserService,
    ) {}


 
// Service Method
async createDriver(dto: any) {
  const { email, fullName ,phoneNumber} = dto;

  // Check if a user with the provided email or fullName already exists
  const existingUser = await this.userModel.findOne({
    $or: [{ email }, { fullName },{phoneNumber}],
  });

  if (existingUser) {
    throw new Error('User with this credential  already exists.');
  }

  // Create a new driver
  return await this.userModel.create({ ...dto, role: 'livreur' });
}

    
    // get all delivery drivers
  async getAllDeliveryDriver() {
    return await this.userModel.find({ role: 'livreur' });  
    }

    // Get delivery driver by ID
async getDeliveryDriverById(id: string) {
  return await this.userModel.findOne({ _id: id, role: 'livreur' });
}

// Update delivery driver
async updateDeliveryDriver(id: string, updateData: Partial<User>) {
  return await this.userModel.findOneAndUpdate(
    { _id: id, role: 'livreur' },
    { $set: updateData },
    { new: true }
  );
}

// Delete delivery driver 
async deleteDeliveryDriver(id: string) {
  return await this.userModel.findOneAndDelete({ _id: id, role: 'livreur' });
}    
}
