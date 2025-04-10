import { Controller, Inject } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ClientProxy,
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
  RpcException,
} from '@nestjs/microservices';
import { BaseRpcController, RmqService } from '@app/rmq';
import {
  LoginPayload,
  RegisterResponse,
  ValidateUserPayload,
} from '@app/common/contracts/auth';
import {
  CreateUserPayload,
  UserWithoutPassword,
} from '@app/common/contracts/user';
import { USER_SERVICE } from '@app/common/constants';
import { catchError, lastValueFrom } from 'rxjs';

@Controller()
export class AuthController extends BaseRpcController {
  constructor(
    private readonly authService: AuthService,
    readonly rmqService: RmqService,
    @Inject(USER_SERVICE) private readonly userServiceClient: ClientProxy,
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

  @MessagePattern('register')
  async register(
    @Payload() payload: CreateUserPayload,
    @Ctx() ctx: RmqContext,
  ): Promise<RegisterResponse> {
    return this.handleMessage(ctx, async () => {
      const user = await lastValueFrom<UserWithoutPassword>(
        this.userServiceClient.send('create_user', payload).pipe(
          catchError((error) => {
            throw new RpcException({
              message: error.message,
              statusCode: error.statusCode,
            });
          }),
        ),
      );

      const tokens = await this.authService.login(user);

      return {
        user,
        accessToken: tokens.access_token,
      };
    });
  }

  @MessagePattern('login')
  async login(@Payload() payload: LoginPayload, @Ctx() ctx: RmqContext) {
    return this.handleMessage(ctx, () => this.authService.login(payload));
  }
}
