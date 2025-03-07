// src/menu-item/menu-item.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Put,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { MenuItemService } from './menu-item.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import { menuItemMulterConfig } from '../../common/config/multer.config'; // Import the correct config
import {
  MenuItemResponse,
  MenuItemsResponse,
  DeleteMenuItemResponse,
} from 'src/common/interfaces/menu-item/menu-item-crud.interface';
import { Types } from 'mongoose';

@ApiTags('Menu Items')
@Controller('menu-items')
export class MenuItemController {
  constructor(private readonly menuItemService: MenuItemService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new menu item for a restaurant' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Menu item created successfully',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @UseInterceptors(FileInterceptor('image', menuItemMulterConfig))
  async create(
    @Query('restoId') restoId: string,
        @Body() createMenuItemDto: CreateMenuItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<MenuItemResponse> {
    console.log('Received restoId:', restoId);
    const objectRestoId = new Types.ObjectId(restoId);
    const result = await this.menuItemService.create(objectRestoId, createMenuItemDto, file);
    return {
      status: HttpStatus.CREATED,
      data: { message: 'Menu item created successfully', result },
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update menu item' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Menu item updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Menu item not found',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', menuItemMulterConfig)) // Use the correct config
  async update(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateMenuItemDto: UpdateMenuItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<MenuItemResponse> {
    const result = await this.menuItemService.update(id, updateMenuItemDto, file);
    return {
      status: HttpStatus.OK,
      data: { message: 'Menu item updated successfully', result },
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all menu items' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Menu items fetched successfully',
  })
  async findAll(@Query() query: any): Promise<MenuItemsResponse> {
    const result = await this.menuItemService.findAll(query);
    return {
      status: HttpStatus.OK,
      data: { message: 'Menu items fetched successfully', result },
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get menu item by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Menu item fetched successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Menu item not found',
  })
  async findOne(
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<MenuItemResponse> {
    const result = await this.menuItemService.findOne(id);
    return {
      status: HttpStatus.OK,
      data: { message: 'Menu item fetched successfully', result },
    };
  }

  // @Patch(':id')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: 'Update menu item' })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: 'Menu item updated successfully',
  // })
  // @ApiResponse({
  //   status: HttpStatus.NOT_FOUND,
  //   description: 'Menu item not found',
  // })
  // @ApiConsumes('multipart/form-data')
  // @UseInterceptors(FileInterceptor('image', multerConfig))
  // async update(
  //   @Param('id', ParseMongoIdPipe) id: string,
  //   @Body() updateMenuItemDto: UpdateMenuItemDto,
  //   @UploadedFile() file?: Express.Multer.File,
  // ): Promise<MenuItemResponse> {
  //   console.log('incoming data', updateMenuItemDto)
  //   const result = await this.menuItemService.update(id, updateMenuItemDto, file);
  //   return {
  //     status: HttpStatus.OK,
  //     data: { message: 'Menu item updated successfully', result },
  //   };
  // }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete menu item' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Menu item deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Menu item not found',
  })
  async remove(
    @Param('id', ParseMongoIdPipe) id: string,
  ): Promise<DeleteMenuItemResponse> {
    await this.menuItemService.remove(id);
    return {
      status: HttpStatus.OK,
      data: { message: 'Menu item deleted successfully', deleted: true },
    };
  }

  @Put(':id/enable')
  async enableMenuItem(@Param('id') id: string)
  {
    await this.menuItemService.enableMenuItem(id);
  }

  @Put(':id/disable')
  async disableMenuItem(@Param('id') id: string)
  {
    await this.menuItemService.disableMenuItem(id);
  }



    /**
     * get resto menu item by resto id
     */

    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get menu item by resto id' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Menu item fetched successfully',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Menu item not found',
    })
    async findRestoMenuItems(
      @Param('id', ParseMongoIdPipe) id: string,
    ): Promise<MenuItemsResponse> {
      const result = await this.menuItemService.findRestoMenuItems(id);
      return {
        status: HttpStatus.OK,
        data: { message: 'Menu item fetched successfully', result },
      };
    }
}
