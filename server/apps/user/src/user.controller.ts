import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { BaseRpcController, RmqService } from '@app/rmq';

@Controller()
export class UserController extends BaseRpcController {
  constructor(
    rmqService: RmqService,
    private readonly userService: UserService,
  ) {
    super(rmqService);
  }

  @MessagePattern('get_user_by_id')
  async getUser(@Payload('id') id: string, @Ctx() ctx: RmqContext) {
    return this.handleMessage(ctx, () => this.userService.getUser(id));
  }
}
