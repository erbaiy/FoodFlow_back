import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MenuItem, MenuItemDocument } from './schema/menu-item.schema';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import * as fs from 'fs/promises';
import { IMenuItem } from 'src/common/interfaces/menu-item/menu-item.interface';

@Injectable()
export class MenuItemService {
    constructor(
        @InjectModel(MenuItem.name)
        private readonly menuItemModel: Model<MenuItemDocument>,
    ) {}

    /**
     * Create a new menu item
     */
    async create(createMenuItemDto: CreateMenuItemDto, file?: Express.Multer.File): Promise<IMenuItem> {
        try {
            // Check for existing item with same name
            await this.checkNameExists(createMenuItemDto.name);

            // Create the menu item
            const menuItem = await this.menuItemModel.create({
                ...createMenuItemDto,
                image: file?.path,
            });

            return this.mapToInterface(menuItem.toObject());
        } catch (error) {
            // Clean up uploaded file if there was an error
            if (file) await this.deleteFile(file.path);
            throw this.handleError(error);
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
        
        return menuItems.map(item => this.mapToInterface(item));
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
    async update(id: string, updateMenuItemDto: UpdateMenuItemDto, file?: Express.Multer.File): Promise<IMenuItem> {
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
                    { new: true, runValidators: true }
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
    private async checkNameExists(name: string, excludeId?: string): Promise<void> {
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
    private mapToInterface(item: any): IMenuItem {
        return {
            _id: item._id,
            name: item.name,
            description: item.description,
            price: item.price,
            image: item.image,
            category: item.category,
            isAvailable: item.isAvailable,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
        };
    }

    /**
     * Helper: Handle common error types
     */
    private handleError(error: any): Error {
        if (error.code === 11000) {
            throw new ConflictException('Menu item with these details already exists');
        }
        if (error.name === 'ValidationError') {
            throw new BadRequestException(error.message);
        }
        return error;
    }
}