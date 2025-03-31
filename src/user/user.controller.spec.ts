import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserDto } from '../dto/user.dto';
import { ProductDto, UpdateProductDto, } from '../dto/product.dto';
import { getModelToken } from '@nestjs/mongoose';
import { User, Product } from '../schema/user.schema';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;

  // Mock data
  const mockUser = {
    _id: 'user-id-123',
    email: 'testuser@gmail.com',
    password: 'hashedpassword',
    toString: () => 'user-id-123',
  };

  const mockProducts = [
    {
      _id: 'product-id-1',
      name: 'Product 1',
      price: 19.99,
      userId: 'user-id-123',
      amount: 30,
      description: 'A test product',
      image: 'http://example.com/image.jpg',
    },
    {
      _id: 'product-id-2',
      name: 'Product 2',
      price: 29.99,
      userId: 'user-id-123',
      amount: 30,
      description: 'A test product2',
      image: 'http://example.com/image.jpg',
    },
  ];

  const mockUserModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    exec: jest.fn(),
  };

  const mockProductModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
    save: jest.fn(),
    exec: jest.fn(),
  };

  // Configure mock implementations
  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock find to return a chainable object
    mockProductModel.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockProducts),
    });

    // Mock findOne to return a chainable object
    mockUserModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockUser),
    });

    // Mock findById to return a chainable object
    mockUserModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockUser),
    });

    // Mock findOne for product
    mockProductModel.findOne.mockResolvedValue({
      _id: 'product-id-1',
      user: 'user-id-123',
      toString: () => 'user-id-123',
    });

    // Mock findOneAndUpdate
    mockProductModel.findOneAndUpdate.mockResolvedValue({
      _id: 'product-id-1',
      name: 'Updated Product',
      price: 24.99,
      user: 'user-id-123',
    });

    // Mock deleteOne to return a chainable object
    mockProductModel.deleteOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    // Mock bcrypt
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const app: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(Product.name),
          useValue: mockProductModel,
        },
      ],
    }).compile();

    userController = app.get<UserController>(UserController);
    userService = app.get<UserService>(UserService);

    // Mock token generation methods
    jest.spyOn(userService as any, 'generateAccessToken').mockReturnValue('test-access-token');
    jest.spyOn(userService as any, 'generateRefreshToken').mockReturnValue('test-refresh-token');

    // Mock for signup
    jest.spyOn(userService, 'signup').mockImplementation(() =>
      Promise.resolve({
        id: 'test-id',
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      })
    );

    jest.spyOn(userService, 'verifyAuth').mockResolvedValue({
      accessToken: 'test-access-token',
      verifyHeader: 'user-id-123',
      products: mockProducts
    });

  });

  describe('signup', () => {
    it('should return a user object', async () => {
      const mockUserDto = {
        email: 'testuser@gmail.com',
        password: 'testpassword',
      };

      const result = await userController.Signup(mockUserDto as UserDto);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('signin', () => {
    it('should return user data with tokens and products', async () => {
      const mockUserDto = {
        email: 'testuser@gmail.com',
        password: 'testpassword',
      };

      // Remove the signup mock to test signin directly
      jest.spyOn(userService, 'signup').mockRestore();

      const result = await userService.signin(mockUserDto as UserDto);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('foundProducts');
      expect(result.foundProducts).toEqual(mockProducts);
    });

    it('should throw an exception if user does not exist', async () => {
      const mockUserDto = {
        email: 'nonexistent@gmail.com',
        password: 'testpassword',
      };

      // Make findOne return null to simulate user not found
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(userService.signin(mockUserDto as UserDto))
        .rejects
        .toThrow(new HttpException(`This user doesn't exist`, HttpStatus.UNAUTHORIZED));
    });

    it('should throw an exception if password is invalid', async () => {
      const mockUserDto = {
        email: 'testuser@gmail.com',
        password: 'wrongpassword',
      };

      // Mock bcrypt to return false for invalid password
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(userService.signin(mockUserDto as UserDto))
        .rejects
        .toThrow(new HttpException('Invalid email or password', HttpStatus.UNAUTHORIZED));
    });
  });

  describe('verifyAuth', () => {
    it('should return access token and products', async () => {
      const verifyHeader = 'user-id-123';

      const result = await userService.verifyAuth(verifyHeader);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('verifyHeader');
      expect(result).toHaveProperty('products');
      expect(result.accessToken).toBe('test-access-token');
      expect(result.verifyHeader).toBe(verifyHeader);
      expect(result.products).toEqual(mockProducts);
    });

  });


  describe('addProduct', () => {
    it('should add a product and return it', async () => {
      const productDto: ProductDto = {
        name: 'New Product',
        price: 39.99,
        description: 'A new test product',
        amount: 10,
        image: 'http://example.com/image.jpg',
      };
      const verifyHeader = 'user-id-123';

      mockProductModel.create = jest.fn().mockResolvedValue({
        _id: 'new-product-id',
        ...productDto,
        userId: verifyHeader, 
      });

      const result = await userService.addProduct(productDto, verifyHeader);

      expect(result).toHaveProperty('_id', 'new-product-id');
      expect(result).toHaveProperty('name', productDto.name);
      expect(result).toHaveProperty('price', productDto.price);
      expect(result).toHaveProperty('userId', verifyHeader);
    });
  });

  describe('updateProduct', () => {
    it('should update a product and return it', async () => {
      const updateDto: UpdateProductDto = {
        name: 'Updated Product',
        price: 24.99,
      };
      const verifyHeader = 'user-id-123';
      const productId = 'product-id-1';

      const mockProduct = {
        _id: productId,
        name: 'Original Product',
        price: 29.99,
        userId: verifyHeader,
        description: 'Original description',
        amount: 5,
        image: 'http://example.com/original.jpg',
      };

      mockProductModel.findOne = jest.fn().mockResolvedValue(mockProduct);

      mockProductModel.findOneAndUpdate = jest.fn().mockResolvedValue({
        _id: productId,
        ...mockProduct,
        ...updateDto,
      });

      const result = await userService.updateProduct(verifyHeader, productId, updateDto);

      expect(result).toHaveProperty('_id', productId);
      expect(result).toHaveProperty('name', updateDto.name);
      expect(result).toHaveProperty('price', updateDto.price);
    });

    it('should throw an exception if user does not own the product', async () => {
      const updateDto: UpdateProductDto = {
        name: 'Updated Product',
        price: 24.99,
      };
      const verifyHeader = 'different-user-id';
      const productId = 'product-id-1';

      await expect(userService.updateProduct(verifyHeader, productId, updateDto))
        .rejects
        .toThrow(new HttpException('You do not have permission to access this product', HttpStatus.FORBIDDEN));
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product and return success message', async () => {
      const verifyHeader = 'user-id-123';
      const productId = 'product-id-1';

      const mockProduct = {
        _id: productId,
        name: 'Product to Delete',
        price: 19.99,
        userId: verifyHeader, // This is crucial - must match verifyHeader
        description: 'Product description',
        amount: 3,
        image: 'http://example.com/image.jpg',
      };

      // Return the mock product when findOne is called
      mockProductModel.findOne = jest.fn().mockResolvedValue(mockProduct);

      mockProductModel.deleteOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 })
      });

      const result = await userService.deleteProduct(verifyHeader, productId);

      expect(result).toBe('Product deleted successfully.');
      expect(mockProductModel.deleteOne).toHaveBeenCalledWith({ _id: productId });
    });

    it('should throw an exception if product does not exist', async () => {
      const verifyHeader = 'user-id-123';
      const productId = 'nonexistent-product';

      mockProductModel.findOne.mockResolvedValue(null);

      await expect(userService.deleteProduct(verifyHeader, productId))
        .rejects
        .toThrow(new HttpException('Product does not exist.', HttpStatus.NOT_FOUND));
    });

    it('should throw an exception if user does not own the product', async () => {
      const verifyHeader = 'different-user-id';
      const productId = 'product-id-1';

      await expect(userService.deleteProduct(verifyHeader, productId))
        .rejects
        .toThrow(new HttpException('You do not have permission to access this product.', HttpStatus.FORBIDDEN));
    });
  });

  describe('getAllUserProducts', () => {
    it('should return all products for a user', async () => {
      const verifyHeader = 'user-id-123';

      const result = await userService.getAllUserProducts(verifyHeader);

      expect(result).toEqual(mockProducts);
      expect(mockProductModel.find).toHaveBeenCalledWith({ userId: verifyHeader });
    });

    it('should throw an exception if user has no products', async () => {
      const verifyHeader = 'user-with-no-products';

      // Mock find to return empty array
      mockProductModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(userService.getAllUserProducts(verifyHeader))
        .rejects
        .toThrow(new HttpException(`You don't have any product.`, HttpStatus.NOT_FOUND));
    });
  });
});