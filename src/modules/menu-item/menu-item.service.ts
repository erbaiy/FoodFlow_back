import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MenuItem, MenuItemDocument } from './schema/menu-item.schema';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import * as fs from 'fs/promises';
import { IMenuItem } from 'src/common/interfaces/menu-item/menu-item.interface';
import { RestaurantDocument } from '../resto/schema/resto.schema';

@Injectable()
export class MenuItemService {
  constructor(
    @InjectModel(MenuItem.name)
    private readonly menuItemModel: Model<MenuItemDocument>,
    @InjectModel('Restaurant')
    private readonly restaurantModel: Model<any>,
  ) {}

  /**
   * Create a new menu item
   */
  async create(
    restoId: Types.ObjectId,
    createMenuItemDto: CreateMenuItemDto,
    file?: Express.Multer.File,
  ): Promise<IMenuItem> {
    try {
      const restaurant = await this.restaurantModel.findById(restoId);
      if (!restaurant) {
        throw new NotFoundException('Restaurant not found');
      }

      await this.checkNameExistsofitem(restoId, createMenuItemDto.name);

      const menuItem = await this.menuItemModel.create({
        ...createMenuItemDto,
        image: file?.path,
      });

      restaurant.menu.push(menuItem._id);
      await restaurant.save();

      return this.mapToInterface(menuItem.toObject());
    } catch (error) {
      if (file) await this.deleteFile(file.path);
      throw this.handleError(error);
    }
  }
  async checkNameExistsofitem(restoId: Types.ObjectId, name: string): Promise<void> {
    const existingItem = await this.menuItemModel.findOne({ name, restaurant: restoId });
    if (existingItem) {
      throw new BadRequestException('Menu item with this name already exists in this restaurant.');
    }
  }


  /**
   * Get all menu items with optional filtering
   */
  async findAll(query: Record<string, any> = {}): Promise<IMenuItem[]> {
    const menuItems = await this.menuItemModel
      .find(this.buildQuery(query))
      .sort({ createdAt: -1 })
      .lean();

    return menuItems.map((item) => this.mapToInterface(item));
  }

  /**
   * Find a single menu item by ID
   */
  async findOne(id: string): Promise<IMenuItem> {
    const menuItem = await this.menuItemModel.findById(id).lean().exec();
    if (!menuItem) {
      throw new NotFoundException(`Menu item with ID ${id} not found`);
    }

    return this.mapToInterface(menuItem);
  }

  /**
   * Update an existing menu item
   */
  async update(
    id: string,
    updateMenuItemDto: UpdateMenuItemDto,
    file?: Express.Multer.File,
  ): Promise<IMenuItem> {
    try {
      // Check if menu item exists
      const menuItem = await this.findById(id);

      // Check for name conflicts if name is being updated
      if (updateMenuItemDto.name) {
        await this.checkNameExists(updateMenuItemDto.name, id);
      }

      // Handle file update
      if (file) {
        if (menuItem.image) await this.deleteFile(menuItem.image);
        updateMenuItemDto.image = file.path;
      }

      // Update the menu item
      const updatedMenuItem = await this.menuItemModel
        .findByIdAndUpdate(
          id,
          { ...updateMenuItemDto },
          { new: true, runValidators: true },
        )
        .lean();

      return this.mapToInterface(updatedMenuItem);
    } catch (error) {
      // Clean up uploaded file if there was an error
      if (file) await this.deleteFile(file.path);
      throw this.handleError(error);
    }
  }

  /**
   * Delete a menu item
   */
  async remove(id: string): Promise<void> {
    const menuItem = await this.findById(id);

    await this.menuItemModel.findByIdAndDelete(id).exec();

    // Clean up associated image file
    if (menuItem.image) await this.deleteFile(menuItem.image);
  }

  /**
   * enable menu item
   */
  async enableMenuItem(id: string): Promise<void> {
    const menuItem = await this.findById(id);
    menuItem.isAvailable = true;
    await menuItem.save();
  }
  /**
   * disable menu item
   */
  async disableMenuItem(id: string): Promise<void> {
    const menuItem = await this.findById(id);
    menuItem.isAvailable = false;
    await menuItem.save();
  }
  /**
   * resto  menu item
   */
  async findRestoMenuItems(restoId: string): Promise<IMenuItem[]> {
    // Step 1: Find the restaurant by ID and select only the `menu` field
    const restaurant = await this.restaurantModel
      .findById(restoId)
      .select('menu')
      .exec();

    // Step 2: Throw an error if the restaurant is not found
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Step 3: Fetch all menu items whose IDs are in the restaurant's `menu` array
    const menuItems = await this.menuItemModel
      .find({
        _id: { $in: restaurant.menu }, // Use $in to match IDs in the `menu` array
      })
      .sort({ createdAt: -1 }) // Sort by creation date (newest first)
      .lean(); // Convert to plain JavaScript objects for better performance

    // Step 4: Map the menu items to the IMenuItem interface
    return menuItems.map((item) => this.mapToInterface(item));
  }

  /**
   * Maps a Mongoose document to the IMenuItem interface.
   * @param item - The Mongoose document or plain object.
   * @returns The mapped IMenuItem object.
   */
  // private mapToInterface(item: any): IMenuItem {
  //   return {
  //     _id: item._id.toString(), // Convert ObjectId to string
  //     name: item.name,
  //     description: item.description,
  //     price: item.price,
  //     image: item.image,
  //     category: item.category,
  //     isAvailable: item.isAvailable,
  //     createdAt: item.createdAt,
  //     updatedAt: item.updatedAt,
  //   };
  // }
  private mapToInterface(item: any): IMenuItem {
    console.log('Item received in mapToInterface:', item);
    if (!item || !item._id) {
      throw new Error('Invalid item provided');
    }
    return {
      _id: item._id.toString(), // Convert ObjectId to string
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      category: item.category,
      isAvailable: item.isAvailable,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  /**
   * Helper: Find menu item by ID or throw NotFoundException
   */
  private async findById(id: string): Promise<MenuItemDocument> {
    const menuItem = await this.menuItemModel.findById(id).exec();
    if (!menuItem) {
      throw new NotFoundException(`Menu item with ID ${id} not found`);
    }
    return menuItem;
  }

  /**
   * Helper: Check if a menu item with the given name already exists
   */
  private async checkNameExists(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const query: any = { name };
    if (excludeId) query._id = { $ne: excludeId };

    const existingItem = await this.menuItemModel.findOne(query).exec();
    if (existingItem) {
      throw new ConflictException(`Menu item "${name}" already exists`);
    }
  }

  /**
   * Helper: Delete a file and ignore errors
   */
  private async deleteFile(path: string): Promise<void> {
    try {
      await fs.unlink(path);
    } catch (error) {
      // Silently ignore file deletion errors
    }
  }

  /**
   * Helper: Build a query for filtering menu items
   */
  private buildQuery(query: Record<string, any>): Record<string, any> {
    const filter: Record<string, any> = {};

    if (query.category) filter.category = query.category;
    if (query.name) filter.name = new RegExp(query.name, 'i');

    // Price filtering
    if (query.minPrice || query.maxPrice) {
      filter.price = {};
      if (query.minPrice) filter.price.$gte = Number(query.minPrice);
      if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
    }

    // Availability filtering
    if (query.isAvailable !== undefined) {
      filter.isAvailable = query.isAvailable === 'true';
    }

    return filter;
  }

  /**
   * Helper: Convert a database object to the IMenuItem interface
   */
  // private mapToInterface(item: any): IMenuItem {
  //   return {
  //     _id: item._id,
  //     name: item.name,
  //     description: item.description,
  //     price: item.price,
  //     image: item.image,
  //     category: item.category,
  //     isAvailable: item.isAvailable,
  //     createdAt: item.createdAt,
  //     updatedAt: item.updatedAt,
  //   };
  // }

  /**
   * Helper: Handle common error types
   */
  private handleError(error: any): Error {
    if (error.code === 11000) {
      throw new ConflictException(
        'Menu item with these details already exists',
      );
    }
    if (error.name === 'ValidationError') {
      throw new BadRequestException(error.message);
    }
    return error;
  }
}
