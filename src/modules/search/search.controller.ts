// src/modules/search/search.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../../common/guards/JwtAuthGuard.guard'; // Assurez-vous d'importer le bon guard
import { Roles } from '../../common/decorators/roles.decorator'; // Assurez-vous d'importer le bon décorateur

@Controller('search')
// @Roles('super_admin') // Assurez-vous d'utiliser le bon rôle pour le super admin
export class SearchController {
  constructor(private searchService: SearchService) {}  

  @Get('users')
  async searchUsers(@Query('query') query: string) {
    return this.searchService.searchUsers(query);
  }

  @Get('restaurants')
  async searchRestaurants(@Query('query') query: string) {
    return this.searchService.searchRestaurants(query);
  }
}