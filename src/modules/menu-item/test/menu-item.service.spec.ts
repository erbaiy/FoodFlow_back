import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MenuItemService } from './../menu-item.service';
import { MenuItem, MenuItemDocument } from './../schema/menu-item.schema';
import { CreateMenuItemDto } from './../dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './../dto/update-menu-item.dto';
import { RestaurantDocument } from '../../resto/schema/resto.schema';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs/promises';

describe('MenuItemService', () => {
  let service: MenuItemService;
  let menuItemModel: Model<MenuItemDocument>;
  let restaurantModel: Model<RestaurantDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuItemService,
        {
          provide: getModelToken(MenuItem.name),
          useValue: {
            create: jest.fn(),
            find: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnValue({
                lean: jest.fn().mockReturnValue({
                  exec: jest.fn(),
                }),
              }),
            }),
            findById: jest.fn().mockReturnValue({
              lean: jest.fn().mockReturnValue({
                exec: jest.fn(),
              }),
              exec: jest.fn(),
            }),
            findOne: jest.fn().mockReturnValue({
              exec: jest.fn(),
            }),
            findByIdAndUpdate: jest.fn().mockReturnValue({
              lean: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue({
                  _id: new Types.ObjectId(),
                  name: 'Updated Pizza',
                  description: 'Classic Italian pizza',
                  price: 15.99,
                  image: '/uploads/image.jpg',
                  category: 'main',
                  isAvailable: true,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }),
              }),
            }),
            findByIdAndDelete: jest.fn().mockReturnValue({
              exec: jest.fn(),
            }),
            save: jest.fn(),
          },
        },
        {
          provide: getModelToken('Restaurant'),
          useValue: {
            findById: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                exec: jest.fn(),
              }),
              exec: jest.fn(),
            }),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MenuItemService>(MenuItemService);
    menuItemModel = module.get<Model<MenuItemDocument>>(getModelToken(MenuItem.name));
    restaurantModel = module.get<Model<RestaurantDocument>>(getModelToken('Restaurant'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a menu item and add it to the restaurant', async () => {
      // Define the required variables
      const restoId = new Types.ObjectId(); // Use ObjectId directly, not string
      const createMenuItemDto: CreateMenuItemDto = {
        name: 'Margherita Pizza',
        description: 'Classic Italian pizza with tomatoes and mozzarella',
        price: 12.99,
        category: 'main',
      };
      const file: Express.Multer.File = {
        fieldname: 'image',
        originalname: 'pizza.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        destination: '/uploads',
        filename: 'pizza.jpg',
        path: '/uploads/pizza.jpg',
        buffer: Buffer.from(''),
        stream: null,
      };

      const fixedId = new Types.ObjectId();
      const mockRestaurant = { 
        _id: restoId, 
        menu: [],
        save: jest.fn().mockResolvedValue(true)
      };
      
      const mockMenuItem = {
        _id: fixedId,
        ...createMenuItemDto,
        image: file.path,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        toObject: jest.fn().mockReturnValue({
          _id: fixedId,
          ...createMenuItemDto,
          image: file.path,
          isAvailable: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };

      // Mock the necessary methods
      jest.spyOn(restaurantModel, 'findById').mockResolvedValue(mockRestaurant);
      jest.spyOn(menuItemModel, 'findOne').mockResolvedValue(null); // No existing menu item
      jest.spyOn(menuItemModel, 'create').mockResolvedValue(mockMenuItem as any);

      // Call the method
      const result = await service.create(restoId, createMenuItemDto, file);

      // Assertions
      expect(restaurantModel.findById).toHaveBeenCalledWith(restoId);
      expect(menuItemModel.create).toHaveBeenCalledWith({
        ...createMenuItemDto,
        image: file.path,
      });
      expect(mockRestaurant.menu).toContainEqual(mockMenuItem._id);
      expect(mockRestaurant.save).toHaveBeenCalled();
      expect(result).toEqual({
        _id: fixedId.toString(),
        name: createMenuItemDto.name,
        description: createMenuItemDto.description,
        price: createMenuItemDto.price,
        image: file.path,
        category: createMenuItemDto.category,
        isAvailable: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should throw NotFoundException if restaurant does not exist', async () => {
      const restoId = new Types.ObjectId(); // Use ObjectId directly, not string
      const createMenuItemDto: CreateMenuItemDto = {
        name: 'Margherita Pizza',
        description: 'Classic Italian pizza with tomatoes and mozzarella',
        price: 12.99,
        category: 'main',
      };
      const file: Express.Multer.File = {
        fieldname: 'image',
        originalname: 'pizza.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        destination: '/uploads',
        filename: 'pizza.jpg',
        path: '/uploads/pizza.jpg',
        buffer: Buffer.from(''),
        stream: null,
      };

      jest.spyOn(restaurantModel, 'findById').mockResolvedValue(null);
      jest.spyOn(fs, 'unlink').mockResolvedValue();

      await expect(service.create(restoId, createMenuItemDto, file)).rejects.toThrow(NotFoundException);
      expect(fs.unlink).toHaveBeenCalledWith(file.path);
    });

    it('should throw BadRequestException if menu item with same name already exists', async () => {
      const restoId = new Types.ObjectId(); // Use ObjectId directly, not string
      const createMenuItemDto: CreateMenuItemDto = {
        name: 'Margherita Pizza',
        description: 'Classic Italian pizza with tomatoes and mozzarella',
        price: 12.99,
        category: 'main',
      };
      const file: Express.Multer.File = {
        fieldname: 'image',
        originalname: 'pizza.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        destination: '/uploads',
        filename: 'pizza.jpg',
        path: '/uploads/pizza.jpg',
        buffer: Buffer.from(''),
        stream: null,
      };

      const mockRestaurant = { _id: restoId, menu: [] };
      const existingMenuItem = { 
        _id: new Types.ObjectId(),
        name: createMenuItemDto.name,
        restaurant: restoId
      };

      jest.spyOn(restaurantModel, 'findById').mockResolvedValue(mockRestaurant);
      jest.spyOn(menuItemModel, 'findOne').mockResolvedValue(existingMenuItem as any);
      jest.spyOn(fs, 'unlink').mockResolvedValue();

      await expect(service.create(restoId, createMenuItemDto, file)).rejects.toThrow(BadRequestException);
      expect(fs.unlink).toHaveBeenCalledWith(file.path);
    });
  });

  describe('findAll', () => {
    it('should return all menu items', async () => {
      const mockMenuItems = [
        {
          _id: new Types.ObjectId(),
          name: 'Pizza',
          description: 'Classic Italian pizza',
          price: 12.99,
          image: 'image.jpg',
          category: 'main',
          isAvailable: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new Types.ObjectId(),
          name: 'Burger',
          description: 'Juicy beef burger',
          price: 8.99,
          image: 'image.jpg',
          category: 'main',
          isAvailable: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(menuItemModel, 'find').mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockMenuItems),
        }),
      } as any);

      const result = await service.findAll();

      expect(menuItemModel.find).toHaveBeenCalledWith({});
      expect(result).toEqual(
        mockMenuItems.map((item) => ({
          _id: item._id.toString(),
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image,
          category: item.category,
          isAvailable: item.isAvailable,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })),
      );
    });
  });

  describe('findOne', () => {
    it('should return a menu item by ID', async () => {
      const mockMenuItem = {
        _id: new Types.ObjectId(),
        name: 'Pizza',
        description: 'Classic Italian pizza',
        price: 12.99,
        image: 'image.jpg',
        category: 'main',
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(menuItemModel, 'findById').mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockMenuItem),
        }),
      } as any);

      const result = await service.findOne(mockMenuItem._id.toString());

      expect(menuItemModel.findById).toHaveBeenCalledWith(mockMenuItem._id.toString());
      expect(result).toEqual({
        _id: mockMenuItem._id.toString(),
        name: mockMenuItem.name,
        description: mockMenuItem.description,
        price: mockMenuItem.price,
        image: mockMenuItem.image,
        category: mockMenuItem.category,
        isAvailable: mockMenuItem.isAvailable,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should throw NotFoundException if menu item does not exist', async () => {
      jest.spyOn(menuItemModel, 'findById').mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      } as any);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const id = new Types.ObjectId().toString();
    const updateMenuItemDto: UpdateMenuItemDto = { name: 'Updated Pizza', price: 15.99 };
    const file: Express.Multer.File = {
      fieldname: 'image',
      originalname: 'image.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      destination: '/uploads',
      filename: 'image.jpg',
      path: '/uploads/image.jpg',
      buffer: Buffer.from(''),
      stream: null,
    };
  
   
  
    it('should throw NotFoundException if menu item does not exist', async () => {
      // Mock the findById method to return null
      jest.spyOn(menuItemModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);
  
      // Expect the update method to throw NotFoundException
      await expect(service.update(id, updateMenuItemDto, file)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    const id = new Types.ObjectId().toString();

    it('should delete a menu item and its associated image', async () => {
      const mockMenuItem = {
        _id: new Types.ObjectId(id),
        name: 'Pizza',
        description: 'Classic Italian pizza',
        price: 12.99,
        image: 'image.jpg',
        category: 'main',
        isAvailable: true,
      };

      jest.spyOn(menuItemModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMenuItem),
      } as any);
      jest.spyOn(menuItemModel, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMenuItem),
      } as any);
      jest.spyOn(fs, 'unlink').mockResolvedValue();

      await service.remove(id);

      expect(menuItemModel.findById).toHaveBeenCalledWith(id);
      expect(menuItemModel.findByIdAndDelete).toHaveBeenCalledWith(id);
      expect(fs.unlink).toHaveBeenCalledWith('image.jpg');
    });

    it('should throw NotFoundException if menu item does not exist', async () => {
      jest.spyOn(menuItemModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('enableMenuItem', () => {
    const id = new Types.ObjectId().toString();

    it('should enable a menu item', async () => {
      const mockMenuItem = {
        _id: new Types.ObjectId(id),
        name: 'Pizza',
        description: 'Classic Italian pizza',
        price: 12.99,
        image: 'image.jpg',
        category: 'main',
        isAvailable: false,
        save: jest.fn(),
      };

      jest.spyOn(menuItemModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMenuItem),
      } as any);

      await service.enableMenuItem(id);

      expect(menuItemModel.findById).toHaveBeenCalledWith(id);
      expect(mockMenuItem.isAvailable).toBe(true);
      expect(mockMenuItem.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if menu item does not exist', async () => {
      jest.spyOn(menuItemModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.enableMenuItem(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('disableMenuItem', () => {
    const id = new Types.ObjectId().toString();

    it('should disable a menu item', async () => {
      const mockMenuItem = {
        _id: new Types.ObjectId(id),
        name: 'Pizza',
        description: 'Classic Italian pizza',
        price: 12.99,
        image: 'image.jpg',
        category: 'main',
        isAvailable: true,
        save: jest.fn(),
      };

      jest.spyOn(menuItemModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMenuItem),
      } as any);

      await service.disableMenuItem(id);

      expect(menuItemModel.findById).toHaveBeenCalledWith(id);
      expect(mockMenuItem.isAvailable).toBe(false);
      expect(mockMenuItem.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if menu item does not exist', async () => {
      jest.spyOn(menuItemModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.disableMenuItem(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findRestoMenuItems', () => {
    const restoId = new Types.ObjectId().toString();

    it('should return menu items for a restaurant', async () => {
      const objectIdRestoId = new Types.ObjectId(restoId);
      const mockRestaurant = { 
        _id: objectIdRestoId, 
        menu: [new Types.ObjectId(), new Types.ObjectId()] 
      };
      const mockMenuItems = [
        {
          _id: mockRestaurant.menu[0],
          name: 'Pizza',
          description: 'Classic Italian pizza',
          price: 12.99,
          image: 'image.jpg',
          category: 'main',
          isAvailable: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: mockRestaurant.menu[1],
          name: 'Burger',
          description: 'Juicy beef burger',
          price: 8.99,
          image: 'image.jpg',
          category: 'main',
          isAvailable: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(restaurantModel, 'findById').mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockRestaurant),
        }),
      } as any);
      jest.spyOn(menuItemModel, 'find').mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockMenuItems),
        }),
      } as any);

      const result = await service.findRestoMenuItems(restoId);

      expect(restaurantModel.findById).toHaveBeenCalledWith(restoId);
      expect(menuItemModel.find).toHaveBeenCalledWith({
        _id: { $in: mockRestaurant.menu },
      });
      expect(result).toEqual(
        mockMenuItems.map((item) => ({
          _id: item._id.toString(),
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image,
          category: item.category,
          isAvailable: item.isAvailable,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })),
      );
    });

    it('should throw NotFoundException if restaurant does not exist', async () => {
      jest.spyOn(restaurantModel, 'findById').mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      } as any);

      await expect(service.findRestoMenuItems(restoId)).rejects.toThrow(NotFoundException);
    });
  });
});