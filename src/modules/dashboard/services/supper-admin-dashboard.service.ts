import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/modules/auth/schema/user.schema';
import { Order, OrderDocument } from 'src/modules/commands/schema/order.schema';
import { Restaurant, RestaurantDocument } from 'src/modules/resto/schema/resto.schema';

@Injectable()
export class SuperAdminDashboardService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Restaurant.name) private restaurantModel: Model<RestaurantDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getDashboardData() {
    // Return all dashboard data in a single request
    const [stats, weeklyOrders, topDrivers, topRestaurants] = await Promise.all([
      this.getStats(),
      this.getWeeklyOrders(),
      this.getTopDrivers(),
      this.getTopRestaurants()
    ]);

    return {
      stats,
      weeklyOrdersData: weeklyOrders,
      drivers: topDrivers,
      restaurants: topRestaurants
    };
  }

  async getStats() {
    // Get counts for restaurants
    const [totalRestaurants, activeRestaurants] = await Promise.all([
      this.restaurantModel.countDocuments(),
      this.restaurantModel.countDocuments({ isApproved: true })
    ]);

    // Get counts for drivers
    const [totalDrivers, activeDrivers] = await Promise.all([
      this.userModel.countDocuments({ role: 'livreur' }),
      this.userModel.countDocuments({ role: 'livreur', isVerified: true })
    ]);

    // Get the start of the current week
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    // Get order counts and revenue calculations
    const [weeklyOrders, totalOrders, weeklyRevenue, totalRevenue] = await Promise.all([
      this.orderModel.countDocuments({ createdAt: { $gte: startOfWeek } }),
      this.orderModel.countDocuments(),
      this.orderModel.aggregate([
        { $match: { createdAt: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      this.orderModel.aggregate([
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ])
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
      totalRestaurants,
      activeRestaurants,
      totalDrivers,
      activeDrivers,
      weeklyOrders,
      totalOrders,
      weeklyRevenue: formatCurrency(weeklyRevenueValue),
      totalRevenue: formatCurrency(totalRevenueValue)
    };
  }

  async getWeeklyOrders() {
    // Get the start of the current week
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
   
    // Initialize day names
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = days.map(day => ({ day, orders: 0 }));
   
    // Get orders for the current week
    const weeklyOrders = await this.orderModel.find({
      createdAt: { $gte: startOfWeek },
    });
   
    // Count orders by day
    weeklyOrders.forEach(order => {
      // Using the createdAt field from the document - safe access
      const orderDate = order.createdAt || new Date(order['_doc']?.createdAt);
      const dayIndex = orderDate.getDay();
      weeklyData[dayIndex].orders += 1;
    });
   
    // Reorder to start with Monday
    const mondayIndex = days.indexOf('Mon');
    return [...weeklyData.slice(mondayIndex), ...weeklyData.slice(0, mondayIndex)];
  }

  async getTopDrivers() {
    // Get top 5 drivers by deliveries
    const topDrivers = await this.userModel
      .find({ role: 'livreur' })
      .sort({ deliveries: -1 })
      .limit(5)
      .exec();

    return topDrivers.map(driver => ({
      id: driver._id,
      name: driver.fullName,
      status: driver.isVerified ? 'active' : 'inactive',
      // Access properties safely
      deliveries: driver['deliveries'] || 0,
      rating: driver['rating'] || 0,
    }));
  }

  async getTopRestaurants() {
    // Get the start of the current week
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
   
    // Count orders by restaurant for the current week
    const weeklyRestaurantOrders = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfWeek },
        },
      },
      {
        $group: {
          _id: '$restaurant',
          ordersThisWeek: { $sum: 1 },
        },
      },
      {
        $sort: { ordersThisWeek: -1 },
      },
      {
        $limit: 5,
      },
    ]);
   
    // Get details for top restaurants
    const restaurantIds = weeklyRestaurantOrders.map(item => item._id);
    const topRestaurants = await this.restaurantModel
      .find({ _id: { $in: restaurantIds } })
      .exec();
   
    // Combine restaurant details with order counts
    return topRestaurants.map(restaurant => {
      const orderInfo = weeklyRestaurantOrders.find(
        item => item._id.toString() === restaurant._id.toString(),
      );
      return {
        id: restaurant._id,
        name: restaurant.name,
        status: restaurant.isApproved ? 'active' : 'pending',
        ordersThisWeek: orderInfo ? orderInfo.ordersThisWeek : 0,
        // Access properties safely
        rating: restaurant['rating'] || 0,
      };
    });
  }
}   














// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { User, UserDocument } from 'src/modules/auth/schema/user.schema';
// import { Order, OrderDocument } from 'src/modules/commands/schema/order.schema';
// import { Restaurant, RestaurantDocument } from 'src/modules/resto/schema/resto.schema';

// @Injectable()
// export class SuperAdminDashboardService {
//   constructor(
//     @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
//     @InjectModel(Restaurant.name) private restaurantModel: Model<RestaurantDocument>,
//     @InjectModel(User.name) private userModel: Model<UserDocument>,
//   ) {}

//   async getDashboardData() {
//     // Implement dashboard data retrieval logic
//     return { message: 'Dashboard data' };
//   }

//   async getStats() {
//     // Implement stats retrieval logic
//     return { message: 'Stats data' };
//   }

//   async getWeeklyOrders() {
//     // Get the start of the current week
//     const startOfWeek = new Date();
//     startOfWeek.setHours(0, 0, 0, 0);
//     startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
//     // Initialize day names
//     const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
//     const weeklyData = days.map(day => ({ day, orders: 0 }));
    
//     // Get orders for the current week
//     const weeklyOrders = await this.orderModel.find({
//       createdAt: { $gte: startOfWeek },
//     });
    
//     // Count orders by day
//     weeklyOrders.forEach(order => {
//       // Using the createdAt field from the document
//       const orderDate = order.createdAt || new Date(order['_doc']?.createdAt);
//       const dayIndex = orderDate.getDay();
//       weeklyData[dayIndex].orders += 1;
//     });
    
//     // Reorder to start with Monday
//     const mondayIndex = days.indexOf('Mon');
//     return [...weeklyData.slice(mondayIndex), ...weeklyData.slice(0, mondayIndex)];
//   }

//   async getTopDrivers() {
//     // Get top 5 drivers by deliveries
//     const topDrivers = await this.userModel
//       .find({ role: 'livreur' })
//       .sort({ deliveries: -1 })
//       .limit(5)
//       .exec();

//     return topDrivers.map(driver => ({
//       id: driver._id,
//       name: driver.fullName,
//       status: driver.isVerified ? 'active' : 'inactive',
//       // Access properties safely
//       deliveries: driver['deliveries'] || 0,
//       rating: driver['rating'] || 0,
//     }));
//   }

//   async getTopRestaurants() {
//     // Get the start of the current week
//     const startOfWeek = new Date();
//     startOfWeek.setHours(0, 0, 0, 0);
//     startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
//     // Count orders by restaurant for the current week
//     const weeklyRestaurantOrders = await this.orderModel.aggregate([
//       {
//         $match: {
//           createdAt: { $gte: startOfWeek },
//         },
//       },
//       {
//         $group: {
//           _id: '$restaurant',
//           ordersThisWeek: { $sum: 1 },
//         },
//       },
//       {
//         $sort: { ordersThisWeek: -1 },
//       },
//       {
//         $limit: 5,
//       },
//     ]);
    
//     // Get details for top restaurants
//     const restaurantIds = weeklyRestaurantOrders.map(item => item._id);
//     const topRestaurants = await this.restaurantModel
//       .find({ _id: { $in: restaurantIds } })
//       .exec();
    
//     // Combine restaurant details with order counts
//     return topRestaurants.map(restaurant => {
//       const orderInfo = weeklyRestaurantOrders.find(
//         item => item._id.toString() === restaurant._id.toString(),
//       );
//       return {
//         id: restaurant._id,
//         name: restaurant.name,
//         status: restaurant.isApproved ? 'active' : 'pending',
//         ordersThisWeek: orderInfo ? orderInfo.ordersThisWeek : 0,
//         // Access properties safely
//         rating: restaurant['rating'] || 0,
//       };
//     });
//   }
// }