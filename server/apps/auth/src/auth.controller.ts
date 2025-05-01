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
  LoginResponse,
  RegisterResponse,
  ValidateUserPayload,
  ValidateUserResponse,
} from '@app/common/contracts/auth';
import { UserWithoutPassword } from '@app/common/contracts/user';
import { USER_SERVICE } from '@app/common/constants';
import { catchError, lastValueFrom } from 'rxjs';
import { RegisterDto } from './dto/auth-register.dto';
import { LoginDto } from './dto/auth-login.dto';
import { RefreshDto } from './dto/auth-refresh.dto';
import { LogoutDto } from './dto/auth-logout.dto';

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
  ): Promise<ValidateUserResponse> {
    return this.handleMessage(ctx, () =>
      this.authService.validateUser(payload),
    );
  }

  @MessagePattern('register')
  async register(
    @Payload() payload: RegisterDto,
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
    @Payload() payload: LoginDto,
    @Ctx() ctx: RmqContext,
  ): Promise<LoginResponse> {
    return this.handleMessage(ctx, () => this.authService.login(payload));
  }

  @MessagePattern('refresh')
  async refresh(
    @Payload() payload: RefreshDto,
    @Ctx() ctx: RmqContext,
  ): Promise<LoginResponse> {
    return this.handleMessage(ctx, () => this.authService.refresh(payload));
  }

  @MessagePattern('logout')
  async logout(
    @Payload() payload: LogoutDto,
    @Ctx() ctx: RmqContext,
  ): Promise<{ success: boolean }> {
    await this.handleMessage(ctx, () => this.authService.logout(payload));
    return { success: true };
  }

  @MessagePattern('logout_all')
  async logoutAll(
    @Payload() payload: LogoutDto,
    @Ctx() ctx: RmqContext,
  ): Promise<{ success: boolean }> {
    await this.handleMessage(ctx, () => this.authService.logoutAll(payload));
    return { success: true };
  }
}
