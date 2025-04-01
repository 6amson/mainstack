import { ModuleRef, NestFactory } from '@nestjs/core';
import { UserModule } from './user/user.module';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { UserService } from './user/user.service';
import { config } from 'dotenv';


config();

const port = process.env.PORT || 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // const userService = app.get(UserService);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204
  });
  await app.listen(port);
  console.log(`Wow, Application is running on: ${await app.getUrl()}`);
}
bootstrap();