import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema, User, Product, ProductSchema } from '../schema/user.schema';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AppController } from '../app.controller';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema }
    ])
  ],
  controllers: [UserController, AppController],
  providers: [UserService],
  exports: [UserService], 
})
export class UserModule {}
