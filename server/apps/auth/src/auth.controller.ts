import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { BaseRpcController, RmqService } from '@app/rmq';
import {
  LoginResponse,
  RegisterResponse,
  ValidateUserPayload,
  ValidateUserResponse,
} from '@app/common/contracts/auth';
import { RegisterDto } from './dto/auth-register.dto';
import { LoginDto } from './dto/auth-login.dto';
import { RefreshDto } from './dto/auth-refresh.dto';
import { LogoutDto } from './dto/auth-logout.dto';
import { ValidateUserOauthDto } from './dto/auth-validate-user-oauth.dto';

@Controller()
export class AuthController extends BaseRpcController {
  constructor(
    private readonly authService: AuthService,
    readonly rmqService: RmqService,
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
    return this.handleMessage(ctx, () => this.authService.register(payload));
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

  @MessagePattern('validate_user_oauth')
  async validateUserOAuth(
    @Payload() payload: ValidateUserOauthDto,
    @Ctx() ctx: RmqContext,
  ): Promise<ValidateUserResponse> {
    return this.handleMessage(ctx, () =>
      this.authService.validateUserOAuth(payload),
    );
  }
}
