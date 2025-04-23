import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { BaseRpcController, RmqService } from '@app/rmq';
import { GetUserByIdDto } from './dto/user-get-by-id.dto';
import { GetUserByNameDto } from './dto/user-get-by-name.dto';
import { CreateUserDto } from './dto/user-create.dto';

@Controller()
export class UserController extends BaseRpcController {
  constructor(
    rmqService: RmqService,
    private readonly userService: UserService,
  ) {
    super(rmqService);
  }

  @MessagePattern('create_user')
  async createUser(@Payload() payload: CreateUserDto, @Ctx() ctx: RmqContext) {
    return this.handleMessage(ctx, () => this.userService.createUser(payload));
  }

  @MessagePattern('get_user_by_id')
  async getUserById(
    @Payload() payload: GetUserByIdDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () => this.userService.getUserById(payload));
  }

  @MessagePattern('get_user_by_name')
  async getUserByName(
    @Payload() payload: GetUserByNameDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.userService.getUserByName(payload),
    );
  }
}
