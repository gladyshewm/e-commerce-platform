import { Controller, Get, Inject, Param } from '@nestjs/common';
import { USER_SERVICE } from './constants/services.constant';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Controller()
export class ApiGatewayController {
  constructor(
    @Inject(USER_SERVICE) private readonly userServiceClient: ClientProxy,
  ) {}

  @Get('/users/:id')
  async getUser(@Param('id') id: string) {
    const user = await lastValueFrom(
      this.userServiceClient.send('get_user_by_id', { id }),
    );
    return user;
  }
}
