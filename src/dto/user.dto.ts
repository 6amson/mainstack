import { IsEmail, IsNotEmpty } from 'class-validator';


export class UserDto {
    @IsEmail()
    @IsNotEmpty()
    readonly email: string;

    @IsNotEmpty()
    readonly password: string;
}

