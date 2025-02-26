import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from 'src/common/interfaces/notification.interface';

@Injectable()
export class NotificationService {
  constructor(@InjectModel('Notification') private notificationModel: Model<Notification>) {}

  async create(notificationData: Partial<Notification>): Promise<Notification> {
    const createdNotification = new this.notificationModel(notificationData);
    return createdNotification.save();
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return this.notificationModel.find({ userId }).exec();
  }

}