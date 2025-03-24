// restaurant.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RestaurantService } from './../resto.service';
import { Restaurant } from './../schema/resto.schema';
import { UserService } from '../../auth/services/userService.service';
import { MenuItemService } from '../../menu-item/menu-item.service';
import { CreateRestaurantDto } from './../dto/create-restaurant.dto';
import UpdateRestaurantDto from './../dto/update-restaurant.dto';
import { HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';
import { Model, Types } from 'mongoose';

describe('RestaurantService', () => {
  let service: RestaurantService;
  let restaurantModel: Model<Restaurant>;
  let userService: UserService;
  let menuItemService: MenuItemService;
  
  const mockRestaurant = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    name: 'Test Restaurant',
    cuisineType: 'Italian',
    address: '123 Test St',
    location: '40.7128° N, 74.0060° W',
    logo: 'path/to/logo.jpg',
    banner: 'path/to/banner.jpg',
    manager: new Types.ObjectId('507f1f77bcf86cd799439012'),
    isApproved: true,
    menu: [new Types.ObjectId('507f1f77bcf86cd799439013')],
    toObject: jest.fn().mockReturnValue({
      _id: '507f1f77bcf86cd799439011',
      name: 'Test Restaurant',
      cuisineType: 'Italian',
      address: '123 Test St',
      location: '40.7128° N, 74.0060° W',
      logo: 'path/to/logo.jpg',
      banner: 'path/to/banner.jpg',
      manager: '507f1f77bcf86cd799439012',
      isApproved: true,
      menu: ['507f1f77bcf86cd799439013'],
    }),
    save: jest.fn().mockReturnThis(),
  };

  const mockUser = {
    _id: '507f1f77bcf86cd799439012',
    fullName: 'John Doe',
    email: 'john@example.com',
    phoneNumber: '+1234567890',
  };

  const mockMenuItem = {
    _id: '507f1f77bcf86cd799439013',
    name: 'Spaghetti',
    description: 'Delicious pasta',
    price: 12.99,
    image: 'path/to/image.jpg',
  };

  const mockRestaurantArray = [mockRestaurant];
  const mockMenuItemArray = [mockMenuItem];

  // Create a proper File mock that matches Express.Multer.File interface
  class MockFile implements Express.Multer.File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
    stream: any;
    
    constructor(path: string) {
      this.fieldname = 'file';
      this.originalname = 'test.jpg';
      this.encoding = '7bit';
      this.mimetype = 'image/jpeg';
      this.size = 5000;
      this.destination = 'uploads/';
      this.filename = 'test.jpg';
      this.path = path;
      this.buffer = Buffer.from('test');
      this.stream = {};
    }
  }

  // Fix: Create a properly typed mock restaurant model
  const mockRestaurantModel = {
    new: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndDelete: jest.fn(),
    exec: jest.fn(),
    populate: jest.fn(),
  };

  // Add a constructor function that creates restaurant instances
  const createMockRestaurantInstance = jest.fn().mockImplementation(() => {
    return {
      ...mockRestaurant,
      save: jest.fn().mockResolvedValue(mockRestaurant)
    };
  });

  const mockUserService = {
    findUserByID: jest.fn(),
  };

  const mockMenuItemService = {
    findRestoMenuItems: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantService,
        {
          provide: getModelToken(Restaurant.name),
          // Use a factory function to create a mock that behaves like a constructor
          useFactory: () => {
            // Make the mock function behave like a constructor
            const MockModel = function() {
              return createMockRestaurantInstance();
            } as any;
            
            // Add all the required model static methods
            Object.assign(MockModel, mockRestaurantModel);
            
            return MockModel;
          },
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: MenuItemService,
          useValue: mockMenuItemService,
        },
      ],
    }).compile();

    service = module.get<RestaurantService>(RestaurantService);
    restaurantModel = module.get<Model<Restaurant>>(getModelToken(Restaurant.name));
    userService = module.get<UserService>(UserService);
    menuItemService = module.get<MenuItemService>(MenuItemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRestaurant', () => {
    const createDto: CreateRestaurantDto = {
      name: 'Test Restaurant',
      cuisineType: 'Italian',
      address: '123 Test St',
      location: '40.7128° N, 74.0060° W',
      email: 'test@restaurant.com',
      password: 'Password123',
      fullName: 'John Doe',
      phoneNumber: '+1234567890',
      role: 'restaurant-manager',
    };

    // Create proper file objects
    const mockFiles = {
      logo: [new MockFile('path/to/logo.jpg')],
      banner: [new MockFile('path/to/banner.jpg')],
    };

    it('should create a restaurant successfully', async () => {
      // Reset the mock to ensure clean state
      createMockRestaurantInstance.mockClear();
      
      // Setup the saved restaurant mock with proper save method
      const savedRestaurant = {
        ...mockRestaurant,
        save: jest.fn().mockResolvedValue(mockRestaurant)
      };
      
      // Make createMockRestaurantInstance return our saved restaurant
      createMockRestaurantInstance.mockReturnValue(savedRestaurant);
      
      const result = await service.createRestaurant(createDto, mockFiles as any);
      
      expect(result.status).toEqual(HttpStatus.CREATED);
      expect(result.data.message).toEqual('Restaurant created successfully');
      expect(result.data.result).toEqual(mockRestaurant.toObject());
      expect(savedRestaurant.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if logo is missing', async () => {
      const filesWithoutLogo = {
        banner: [new MockFile('path/to/banner.jpg')],
      };

      await expect(service.createRestaurant(createDto, filesWithoutLogo as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if banner is missing', async () => {
      const filesWithoutBanner = {
        logo: [new MockFile('path/to/logo.jpg')],
      };

      await expect(service.createRestaurant(createDto, filesWithoutBanner as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException on save error', async () => {
      // Create a restaurant instance that throws on save
      const errorRestaurant = {
        ...mockRestaurant,
        save: jest.fn().mockImplementation(() => {
          throw new Error('Database error');
        })
      };
      
      // Make createMockRestaurantInstance return our error restaurant
      createMockRestaurantInstance.mockReturnValue(errorRestaurant);
      
      await expect(service.createRestaurant(createDto, mockFiles as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateRestaurant', () => {
    const updateDto: UpdateRestaurantDto = {
      name: 'Updated Restaurant',
      cuisineType: 'Mexican',
    };

    // Create proper file objects
    const mockFiles = {
      logo: [new MockFile('path/to/new-logo.jpg')],
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should update a restaurant successfully', async () => {
      const updatedRestaurant = {
        ...mockRestaurant,
        name: 'Updated Restaurant',
        cuisineType: 'Mexican',
        logo: 'path/to/new-logo.jpg',
        save: jest.fn().mockResolvedValue({
          ...mockRestaurant,
          name: 'Updated Restaurant',
          cuisineType: 'Mexican',
          logo: 'path/to/new-logo.jpg',
        }),
      };
      
      jest.spyOn(restaurantModel, 'findById').mockResolvedValueOnce(updatedRestaurant as any);

      const result = await service.updateRestaurant('507f1f77bcf86cd799439011', updateDto, mockFiles as any);
      
      expect(result.status).toEqual(HttpStatus.OK);
      expect(result.data.message).toEqual('Restaurant updated successfully');
    });

    it('should return NotFoundException if restaurant not found', async () => {
      jest.spyOn(restaurantModel, 'findById').mockResolvedValueOnce(null);

      const result = await service.updateRestaurant('nonexistentid', updateDto);
      
      expect(result.status).toEqual(HttpStatus.BAD_REQUEST);
      expect(result.data.error).toContain('not found');
    });

    it('should handle conflict error when updating restaurant', async () => {
      const errorRestaurant = {
        ...mockRestaurant,
        save: jest.fn().mockImplementation(() => {
          throw new Error('Restaurant name already exists');
        }),
      };
      
      jest.spyOn(restaurantModel, 'findById').mockResolvedValueOnce(errorRestaurant as any);

      const result = await service.updateRestaurant('507f1f77bcf86cd799439011', updateDto);
      
      expect(result.status).toEqual(HttpStatus.CONFLICT);
      expect(result.data.error).toContain('already exists');
    });
  });

  describe('getAllRestaurants', () => {
    it('should return all restaurants', async () => {
      mockRestaurantModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockRestaurantArray),
        }),
      });

      const result = await service.getAllRestaurants();
      
      expect(result.status).toEqual(HttpStatus.OK);
      expect(result.data.result).toEqual(mockRestaurantArray);
      expect(result.data.count).toEqual(mockRestaurantArray.length);
    });

    it('should handle errors when getting all restaurants', async () => {
      mockRestaurantModel.find.mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      const result = await service.getAllRestaurants();
      
      expect(result.status).toEqual(HttpStatus.BAD_REQUEST);
      expect(result.data.error).toBeDefined();
    });
  });

  describe('getRestaurantById', () => {
    it('should return a restaurant by ID', async () => {
      mockRestaurantModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockRestaurant),
        }),
      });

      const result = await service.getRestaurantById('507f1f77bcf86cd799439011');
      
      expect(result.status).toEqual(HttpStatus.OK);
      expect(result.data.result).toEqual(mockRestaurant);
    });

    it('should return NotFoundException if restaurant not found', async () => {
      mockRestaurantModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await service.getRestaurantById('nonexistentid');
      
      expect(result.status).toEqual(HttpStatus.BAD_REQUEST);
      expect(result.data.error).toContain('not found');
    });
  });

  describe('deleteRestaurant', () => {
    it('should delete a restaurant successfully', async () => {
      jest.spyOn(restaurantModel, 'findByIdAndDelete').mockResolvedValueOnce(mockRestaurant as any);

      const result = await service.deleteRestaurant('507f1f77bcf86cd799439011');
      
      expect(result.status).toEqual(HttpStatus.OK);
      expect(result.data.message).toEqual('Restaurant deleted successfully');
      expect(result.data.deleted).toBeTruthy();
    });

    it('should return NotFoundException if restaurant not found', async () => {
      jest.spyOn(restaurantModel, 'findByIdAndDelete').mockResolvedValueOnce(null);

      const result = await service.deleteRestaurant('nonexistentid');
      
      expect(result.status).toEqual(HttpStatus.BAD_REQUEST);
      expect(result.data.error).toContain('not found');
      expect(result.data.deleted).toBeFalsy();
    });
  });

  describe('getRestaurantsWithManagers', () => {
    it('should return restaurants with managers', async () => {
      mockRestaurantModel.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockRestaurantArray),
      });

      const result = await service.getRestaurantsWithManagers();
      
      expect(result).toEqual(mockRestaurantArray);
    });

    it('should throw error on database failure', async () => {
      mockRestaurantModel.find.mockReturnValue({
        populate: jest.fn().mockImplementationOnce(() => {
          throw new Error('Database error');
        }),
      });

      await expect(service.getRestaurantsWithManagers()).rejects.toThrow(Error);
    });
  });

  describe('getManagerProfile', () => {
    const userId = '507f1f77bcf86cd799439012';
    const restoId = '507f1f77bcf86cd799439011';

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return manager profile with restaurants', async () => {
      mockRestaurantModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{
          ...mockRestaurant,
          _id: { toString: () => restoId },
        }]),
      });

      mockUserService.findUserByID.mockResolvedValue(mockUser);
      mockMenuItemService.findRestoMenuItems.mockResolvedValue(mockMenuItemArray);

      const result = await service.getManagerProfile(userId);
      
      expect(result.status).toEqual(HttpStatus.OK);
      expect(result.data.result.manager.name).toEqual(mockUser.fullName);
      expect(result.data.result.restaurants).toHaveLength(1);
      expect(result.data.result.restaurants[0].menu).toHaveLength(1);
    });

    it('should handle manager not found', async () => {
      mockRestaurantModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{
          ...mockRestaurant,
          _id: { toString: () => restoId },
        }]),
      });

      mockUserService.findUserByID.mockResolvedValue(null);

      const result = await service.getManagerProfile(userId);
      
      expect(result.status).toEqual(HttpStatus.BAD_REQUEST);
      expect(result.data.error).toContain('Manager not found');
    });

    it('should handle database errors', async () => {
      mockRestaurantModel.find.mockReturnValue({
        exec: jest.fn().mockImplementationOnce(() => {
          throw new Error('Database error');
        }),
      });

      const result = await service.getManagerProfile(userId);
      
      expect(result.status).toEqual(HttpStatus.BAD_REQUEST);
      expect(result.data.error).toContain('Database error');
    });
  });

  describe('findRestaurantByName', () => {
    it('should find a restaurant by name', async () => {
      mockRestaurantModel.findOne.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValueOnce(mockRestaurant),
      });

      const result = await service.findRestaurantByName('Test Restaurant');
      
      expect(result).toEqual(mockRestaurant);
    });

    it('should return null if restaurant not found', async () => {
      mockRestaurantModel.findOne.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValueOnce(null),
      });

      const result = await service.findRestaurantByName('Nonexistent Restaurant');
      
      expect(result).toBeNull();
    });

    it('should throw BadRequestException on database error', async () => {
      mockRestaurantModel.findOne.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockImplementationOnce(() => {
          throw new Error('Database error');
        }),
      });

      await expect(service.findRestaurantByName('Test Restaurant')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});