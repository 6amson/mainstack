import { UserService } from './user.service';
import { Body, Controller, Delete, Get, HttpStatus, Redirect, Param, Post, Headers, Put, Req, Res, UseGuards } from "@nestjs/common";
import { User, Product } from "../schema/user.schema";
import { UserDto, } from "../dto/user.dto";
import { ProductDto, UpdateProductDto,  } from '../dto/product.dto';
import { JwtAuthGuard } from '../guard/user.guard';
import { RequestWithUser } from '../types/types';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService
  ) { }

  @Post('signup')
  async Signup(@Body() user: UserDto): Promise<{
    id: string;
    accessToken: string;
    refreshToken: string;
  }> {
    const newUser = await this.userService.signup(user);
    return newUser;
  }

  @Post('signin')
  async SignIn(@Body() user: UserDto) {
    const userInfo = await this.userService.signin(user);
    return userInfo
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  async verifyAuth(@Req() req: RequestWithUser,) {
    const { payload: userId } = req.user as any;
    return this.userService.verifyAuth(userId)
  }

  @Post('addproduct')
  @UseGuards(JwtAuthGuard)
  async addProduct(@Req() req: RequestWithUser, @Body() productData: ProductDto) {
    const { payload: userId } = req.user as any;
    return this.userService.addProduct(productData, userId);
  }

  @Put('updateproduct')
  @UseGuards(JwtAuthGuard)
  async updateProduct(@Req() req: RequestWithUser, @Body() productData: UpdateProductDto, @Headers('productId') productId: string) {
    const { payload: userId } = req.user as any;
    return this.userService.updateProduct(userId, productId, productData);
  }

  @Delete('deleteproduct')
  @UseGuards(JwtAuthGuard)
  async deleteProduct(@Req() req: RequestWithUser, @Headers('productId') productId: string) {
    const { payload: userId } = req.user as any;
    return this.userService.deleteProduct(userId, productId);
  }

  @Get('getproduct')
  @UseGuards(JwtAuthGuard)
  async getProduct(@Req() req: RequestWithUser,) {
    const { payload: userId } = req.user as any;
    return this.userService.getAllUserProducts(userId)
  }
}
