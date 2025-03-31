import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { HydratedDocument, Document } from 'mongoose';
import { UserStatus } from "../types/statics";

export type UserDocument = HydratedDocument<User>;
export type ProductDocument = HydratedDocument<Product>;

@Schema()
export class User {  // Remove "extends Document" here
    @Prop({ required: true, unique: true, lowercase: true })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @Prop({ required: true })
    @IsNotEmpty()
    password: string;

    @Prop({ enum: UserStatus, default: UserStatus.ACTIVE })
    @IsOptional()
    status: UserStatus;
}

@Schema()
export class Product {  // Remove "extends Document" here
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    price: number;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true })
    image: string;

    @Prop({ required: true })
    amount: number;

    @Prop({ type: String, required: true })
    @IsNotEmpty()
    userId: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
export const ProductSchema = SchemaFactory.createForClass(Product);