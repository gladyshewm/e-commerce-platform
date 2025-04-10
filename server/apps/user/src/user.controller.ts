import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { BaseRpcController, RmqService } from '@app/rmq';
import {
  CreateUserPayload,
  GetUserByIdPayload,
  GetUserByNamePayload,
} from '@app/common/contracts/user';

@Controller()
export class UserController extends BaseRpcController {
  constructor(
    rmqService: RmqService,
    private readonly userService: UserService,
  ) {
    super(rmqService);
  }

  @MessagePattern('create_user')
  async createUser(
    @Payload() payload: CreateUserPayload,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () => this.userService.createUser(payload));
  }

  @MessagePattern('get_user_by_id')
  async getUserById(
    @Payload() payload: GetUserByIdPayload,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () => this.userService.getUserById(payload));
  }

  @MessagePattern('get_user_by_name')
  async getUserByName(
    @Payload() payload: GetUserByNamePayload,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.userService.getUserByName(payload),
    );
  }
}
