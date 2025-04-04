import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('user/:id')
  async getUser(@Param('id') id: string) {
    return this.userService.getUser(id);
  }
}
