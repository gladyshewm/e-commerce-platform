import {
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { AUTH_SERVICE, USER_SERVICE } from '@app/common/constants';
import { JwtAuthGuard, LocalAuthGuard } from '@app/common/auth';
import { CurrentUser } from '@app/common/decorators';
import { LoginResponse, User } from '@app/common/types';
import { GetUserDto } from './dto/get-user.dto';

@Controller()
export class ApiGatewayController {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authServiceClient: ClientProxy,
    @Inject(USER_SERVICE) private readonly userServiceClient: ClientProxy,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@CurrentUser() user: User) {
    const jwt = await lastValueFrom<LoginResponse>(
      this.authServiceClient.send('login', user),
    );
    return jwt;
  }

  @UseGuards(JwtAuthGuard)
  @Get('/users/:id')
  async getUser(@Param() dto: GetUserDto) {
    const user = await lastValueFrom<User>(
      this.userServiceClient.send('get_user_by_id', dto),
    );
    return user;
  }
}
