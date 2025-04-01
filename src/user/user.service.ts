import { Document, Types } from 'mongoose';
import { Injectable, HttpException, HttpStatus, } from "@nestjs/common";
import { httpErrorException } from "../app.exception";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, Product, UserDocument } from "../schema/user.schema";
import * as jwt from 'jsonwebtoken';
const bcrypt = require('bcrypt');
import { config } from 'dotenv';
import { UserDto } from "../dto/user.dto";
import { ProductDto, UpdateProductDto, } from 'src/dto/product.dto';


config();

const accessTokenSecret: string = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret: string = process.env.REFRESH_TOKEN_SECRET;

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Product.name) private productModel: Model<Product>
  ) { }

  private isBanned(user: UserDocument): void {
    if (user.status === 'Banned') {
      throw new httpErrorException(
        'You have been banned.',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  public async isUserActive(user: UserDocument): Promise<Document<unknown, {}, User> & User & Required<{
    _id: unknown;
  }> & {
    __v: number;
  }> {
    if (!user) {
      throw new httpErrorException(
        'This user does not exist, please sign up.',
        HttpStatus.NOT_FOUND,
      );
    }
    else if (user.status === 'Inactive') {
      throw new httpErrorException(
        'You recently deleted your account, sign up to reactivate.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    this.isBanned(user);
    return user;
  }

  //METHODS
  private generateAccessToken(payload: any): string {
    return jwt.sign({ payload }, accessTokenSecret, {
      expiresIn: '90d',
    });
  }

  private generateRefreshToken(payload: any): string {
    return jwt.sign({ payload }, refreshTokenSecret,
      { expiresIn: "5m" },
    );
  }

  private async getProductsByUserId(verifyHeader: string): Promise<any> {
    // const Id = this.verifyToken(verifyHeader);
    return await this.productModel.find({ user: verifyHeader }).exec();
  }


  //ROUTES

  async signup(user: UserDto): Promise<{ id: string, accessToken: string, refreshToken: string }> {
    const existingUser = await this.userModel.findOne({ email: user.email }).exec();

    if (existingUser) {
      throw new httpErrorException('User with this email already exists', HttpStatus.CONFLICT);
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);

    const newUser = await this.userModel.create({
      ...user,
      password: hashedPassword,
    });

    newUser.save();
    const id = newUser._id.toString();

    const accessToken = this.generateAccessToken(newUser._id);
    const refreshToken = this.generateRefreshToken(newUser._id);

    return { id, accessToken, refreshToken }
  }

  async signin(user: UserDto): Promise<{ accessToken: string, refreshToken: string, id: string, foundProducts: Product[] }> {
    const foundUser = await this.userModel.findOne({ email: user.email }).exec();

    if (!foundUser) {
      throw new HttpException(`This user doesn't exist`, HttpStatus.UNAUTHORIZED);
    }
    const foundProducts = await this.productModel.find({ userId: foundUser._id.toString() }).exec();

    const isPasswordValid = await bcrypt.compare(user.password, foundUser.password);

    if (!isPasswordValid) {

      throw new HttpException('Invalid email or password', HttpStatus.UNAUTHORIZED);
    }

    const accessToken = this.generateAccessToken(foundUser._id);
    const refreshToken = this.generateRefreshToken(foundUser._id);
    const id = foundUser._id.toString();


    return {
      accessToken,
      refreshToken,
      id,
      foundProducts
    }

  };


  public async verifyAuth(verifyHeader: string): Promise<{ accessToken: string, verifyHeader: string, products: Product[] }> {
    const accessToken = this.generateAccessToken(verifyHeader);

    const userProfile = await this.userModel.findById(verifyHeader).exec();
    if (userProfile) {
      const products = await this.productModel.find({ userId: verifyHeader });
      return { accessToken, verifyHeader, products };
    }

  };

  async addProduct(productData: ProductDto, verifyHeader: string): Promise<Product> {
    const product = await this.productModel.create({
      ...productData,
      userId: verifyHeader,
    });
    return product;
  }


  async updateProduct(verifyHeader: string, productId: string, updateData: UpdateProductDto): Promise<Product> {
    const product = await this.productModel.findOne({ _id: productId });

    if (product.userId !== verifyHeader) {
      throw new HttpException('You do not have permission to access this product', HttpStatus.FORBIDDEN);
    }

    const updatedProduct = await this.productModel.findOneAndUpdate(
      { _id: productId },
      { $set: updateData },
      { new: true }
    );

    return updatedProduct;
  }

  async deleteProduct(verifyHeader: string, productId: string): Promise<string> {
    const product = await this.productModel.findOne({ _id: productId });

    if (!product) {
      throw new HttpException(`Product does not exist.`, HttpStatus.NOT_FOUND);
    }

    if (product.userId !== verifyHeader) {
      throw new HttpException('You do not have permission to access this product.', HttpStatus.FORBIDDEN);
    }

    const deletedProduct = await this.productModel.deleteOne({ _id: productId }).exec();

    return "Product deleted successfully.";
  }


  async getAllUserProducts(verifyHeader: string): Promise<Product[]> {
    const products = await this.productModel.find({ userId: verifyHeader }).exec();
    if (!products) {
      throw new HttpException(`You don't have any product.`, HttpStatus.NOT_FOUND);
    }
    return products;
  }
}
