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
  LoginResponse,
  LogoutPayload,
  RefreshPayload,
  RegisterPayload,
  RegisterResponse,
  ValidateUserPayload,
} from '@app/common/contracts/auth';
import { UserWithoutPassword } from '@app/common/contracts/user';
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
    @Payload() payload: RegisterPayload,
    @Ctx() ctx: RmqContext,
  ): Promise<RegisterResponse> {
    return this.handleMessage(ctx, async () => {
      const { ipAddress, userAgent, ...credentials } = payload;

      const user = await lastValueFrom<UserWithoutPassword>(
        this.userServiceClient.send('create_user', credentials).pipe(
          catchError((error) => {
            throw new RpcException({
              message: error.message,
              statusCode: error.statusCode,
            });
          }),
        ),
      );

      const tokens = await this.authService.login({
        ...user,
        ipAddress,
        userAgent,
      });

      return {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    });
  }

  @MessagePattern('login')
  async login(
    @Payload() payload: LoginPayload,
    @Ctx() ctx: RmqContext,
  ): Promise<LoginResponse> {
    return this.handleMessage(ctx, () => this.authService.login(payload));
  }

  @MessagePattern('refresh')
  async refresh(
    @Payload() payload: RefreshPayload,
    @Ctx() ctx: RmqContext,
  ): Promise<LoginResponse> {
    return this.handleMessage(ctx, () => this.authService.refresh(payload));
  }

  @MessagePattern('logout')
  async logout(
    @Payload() payload: LogoutPayload,
    @Ctx() ctx: RmqContext,
  ): Promise<{ success: boolean }> {
    await this.handleMessage(ctx, () => this.authService.logout(payload));
    return { success: true };
  }

  @MessagePattern('logout_all')
  async logoutAll(
    @Payload() payload: LogoutPayload,
    @Ctx() ctx: RmqContext,
  ): Promise<{ success: boolean }> {
    await this.handleMessage(ctx, () => this.authService.logoutAll(payload));
    return { success: true };
  }
}
