// super-admin-dashboard.controller.ts
import { Controller, Get } from "@nestjs/common";
import { SuperAdminDashboardService } from "../services/supper-admin-dashboard.service";

@Controller('super-admin/dashboard') // Fixed typo 'dashbord' to 'dashboard'
export class SuperAdminDashboardController {
    
  constructor(private readonly dashboardService: SuperAdminDashboardService) {}

  @Get()
  getDashboardData() {
    return this.dashboardService.getDashboardData();
  }

  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('weekly-orders')
  getWeeklyOrders() {
    return this.dashboardService.getWeeklyOrders();
  }

  @Get('top-drivers')
  getTopDrivers() {
    return this.dashboardService.getTopDrivers();
  }

  @Get('top-restaurants')
  getTopRestaurants() {
    return this.dashboardService.getTopRestaurants();
  }
}