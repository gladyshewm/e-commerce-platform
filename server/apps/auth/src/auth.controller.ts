import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { BaseRpcController, RmqService } from '@app/rmq';
import { ValidateUserPayload } from './types/validate-user-payload.interface';
import { LoginPayload } from './types/login-payload.interface';

@Controller()
export class AuthController extends BaseRpcController {
  constructor(
    private readonly authService: AuthService,
    rmqService: RmqService,
  ) {
    super(rmqService);
  }

  @MessagePattern('validate_user')
  async validateUser(
    @Payload() payload: ValidateUserPayload,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.authService.validateUser(payload),
    );
  }

  @MessagePattern('login')
  async login(@Payload() payload: LoginPayload, @Ctx() ctx: RmqContext) {
    return this.handleMessage(ctx, () => this.authService.login(payload));
  }
}
