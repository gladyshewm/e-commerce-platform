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
import { UpdateUserRoleDto } from './dto/user-update-role.dto';
import { GetUserByOAuthDto } from './dto/user-get-by-oauth.dto';
import { LinkUserWithOAuthDto } from './dto/user-link-with-oauth.dto';
import { CreateUserOAuthDto } from './dto/user-create-oauth.dto';
import { GetUserByEmailDto } from './dto/user-get-by-email.dto';
import { ActivateUserEmailDto } from './dto/user-activate-email.dto';
import { SendEmailActivationLinkDto } from './dto/user-send-email-activation-link.dto';

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

  @MessagePattern('send_email_activation_link')
  async sendEmailActivationLink(
    @Payload() payload: SendEmailActivationLinkDto,
    @Ctx() ctx: RmqContext,
  ): Promise<{ success: boolean }> {
    await this.handleMessage(ctx, () =>
      this.userService.sendEmailActivationLink(payload),
    );

    return { success: true };
  }

  @MessagePattern('activate_user_email')
  async activateUserEmail(
    @Payload() payload: ActivateUserEmailDto,
    @Ctx() ctx: RmqContext,
  ): Promise<{ success: boolean }> {
    await this.handleMessage(ctx, () =>
      this.userService.activateUserEmail(payload),
    );

    return { success: true };
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

  @MessagePattern('update_user_role')
  async updateUserRole(
    @Payload() payload: UpdateUserRoleDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.userService.updateUserRole(payload),
    );
  }

  @MessagePattern('get_user_by_oauth')
  async getUserByOAuth(
    @Payload() payload: GetUserByOAuthDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.userService.getUserByOAuth(payload),
    );
  }

  @MessagePattern('get_user_by_email')
  async getUserByEmail(
    @Payload() payload: GetUserByEmailDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.userService.getUserByEmail(payload),
    );
  }

  @MessagePattern('link_user_with_oauth')
  async linkUserWithOAuth(
    @Payload() payload: LinkUserWithOAuthDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.userService.linkUserWithOAuth(payload),
    );
  }

  @MessagePattern('create_user_oauth')
  async createUserOAuth(
    @Payload() payload: CreateUserOAuthDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.userService.createUserOAuth(payload),
    );
  }
}
