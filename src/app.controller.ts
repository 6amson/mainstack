import { Controller, Get, HttpStatus } from '@nestjs/common';

@Controller('')
export class AppController {
  @Get('')
  getMain() {
    return ('Guarded and healthy.')
  }
}
