import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { RestoManagerDashboardService } from '../services/resto-manager-dashboard.service';
import { ManagerToRestoPipe } from 'src/common/pipes/manager-to-resto-id.pipe';

@Controller('resto-manager/dashboard')
export class RestoManagerDashboardController {
  constructor(private readonly dashboardService: RestoManagerDashboardService) {}

  @Get(':managerId')
  getDashboardData(@Param('managerId', ManagerToRestoPipe) restaurantId: string) {
    return this.dashboardService.getDashboardData(restaurantId);
  }

  @Get('stats/:managerId')
  getStats(@Param('managerId', ManagerToRestoPipe) restaurantId: string) {
    return this.dashboardService.getStats(restaurantId);
  }

  @Get('weekly-orders/:managerId')
  getWeeklyOrders(@Param('managerId', ManagerToRestoPipe) restaurantId: string) {
    return this.dashboardService.getWeeklyOrders(restaurantId);
  }

  @Get('top-menu-items/:managerId')
  getTopMenuItems(@Param('managerId', ManagerToRestoPipe) restaurantId: string) {
    return this.dashboardService.getTopMenuItems(restaurantId);
  }
}
