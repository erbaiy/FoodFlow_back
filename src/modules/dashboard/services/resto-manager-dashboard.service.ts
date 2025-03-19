import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from 'src/modules/commands/schema/order.schema';
import { Restaurant, RestaurantDocument } from 'src/modules/resto/schema/resto.schema';

@Injectable()
export class RestoManagerDashboardService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Restaurant.name) private restaurantModel: Model<RestaurantDocument>,
  ) {}

  async getDashboardData(restaurantId: string) {
    // Return all dashboard data in a single request
    const [stats, weeklyOrders, topMenuItems] = await Promise.all([
      this.getStats(restaurantId),
      this.getWeeklyOrders(restaurantId),
      this.getTopMenuItems(restaurantId),
    ]);

    return {
      stats,
      weeklyOrdersData: weeklyOrders,
      topMenuItems,
    };
  }

  async getStats(restaurantId: string) {
    // Get restaurant details
    const restaurant = await this.restaurantModel.findById(restaurantId).exec();

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    // Get the start of the current week
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    // Get order counts and revenue calculations for the restaurant
    const [weeklyOrders, totalOrders, weeklyRevenue, totalRevenue] = await Promise.all([
      this.orderModel.countDocuments({ restaurant: restaurantId, createdAt: { $gte: startOfWeek } }),
      this.orderModel.countDocuments({ restaurant: restaurantId }),
      this.orderModel.aggregate([
        { $match: { restaurant: restaurantId, createdAt: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      this.orderModel.aggregate([
        { $match: { restaurant: restaurantId } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
    ]);

    // Format the revenue values
    const formatCurrency = (value) => {
      if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `$${(value / 1000).toFixed(1)}K`;
      }
      return `$${value.toFixed(2)}`;
    };

    const weeklyRevenueValue = weeklyRevenue.length > 0 ? weeklyRevenue[0].total : 0;
    const totalRevenueValue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    return {
      restaurantName: restaurant.name,
      status: restaurant.isApproved ? 'active' : 'pending',
      weeklyOrders,
      totalOrders,
      weeklyRevenue: formatCurrency(weeklyRevenueValue),
      totalRevenue: formatCurrency(totalRevenueValue),
    };
  }

  async getWeeklyOrders(restaurantId: string) {
    // Get the start of the current week
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    // Initialize day names
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = days.map(day => ({ day, orders: 0 }));

    // Get orders for the current week for the restaurant
    const weeklyOrders = await this.orderModel.find({
      restaurant: restaurantId,
      createdAt: { $gte: startOfWeek },
    });

    // Count orders by day
    weeklyOrders.forEach(order => {
      const orderDate = order.createdAt || new Date(order['_doc']?.createdAt);
      const dayIndex = orderDate.getDay();
      weeklyData[dayIndex].orders += 1;
    });

    // Reorder to start with Monday
    const mondayIndex = days.indexOf('Mon');
    return [...weeklyData.slice(mondayIndex), ...weeklyData.slice(0, mondayIndex)];
  }

  async getTopMenuItems(restaurantId: string) {
    // Get the start of the current week
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    // Count orders by menu item for the current week
    const weeklyMenuItemOrders = await this.orderModel.aggregate([
      {
        $match: {
          restaurant: restaurantId,
          createdAt: { $gte: startOfWeek },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          ordersThisWeek: { $sum: '$items.quantity' },
        },
      },
      {
        $sort: { ordersThisWeek: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    // Return top menu items with their order counts
    return weeklyMenuItemOrders.map(item => ({
      menuItemId: item._id,
      ordersThisWeek: item.ordersThisWeek,
    }));
  }
}