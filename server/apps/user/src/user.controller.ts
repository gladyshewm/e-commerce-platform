import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { BaseRpcController, RmqService } from '@app/rmq';
import { UserCommands } from '@app/common/messaging';
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

  @MessagePattern(UserCommands.Create)
  async createUser(@Payload() payload: CreateUserDto, @Ctx() ctx: RmqContext) {
    return this.handleMessage(ctx, () => this.userService.createUser(payload));
  }

  @MessagePattern(UserCommands.SendEmailActivationLink)
  async sendEmailActivationLink(
    @Payload() payload: SendEmailActivationLinkDto,
    @Ctx() ctx: RmqContext,
  ): Promise<{ success: boolean }> {
    await this.handleMessage(ctx, () =>
      this.userService.sendEmailActivationLink(payload),
    );

    return { success: true };
  }

  @MessagePattern(UserCommands.ActivateEmail)
  async activateUserEmail(
    @Payload() payload: ActivateUserEmailDto,
    @Ctx() ctx: RmqContext,
  ): Promise<{ success: boolean }> {
    await this.handleMessage(ctx, () =>
      this.userService.activateUserEmail(payload),
    );

    return { success: true };
  }

  @MessagePattern(UserCommands.GetById)
  async getUserById(
    @Payload() payload: GetUserByIdDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () => this.userService.getUserById(payload));
  }

  @MessagePattern(UserCommands.GetByName)
  async getUserByName(
    @Payload() payload: GetUserByNameDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.userService.getUserByName(payload),
    );
  }

  @MessagePattern(UserCommands.UpdateRole)
  async updateUserRole(
    @Payload() payload: UpdateUserRoleDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.userService.updateUserRole(payload),
    );
  }

  @MessagePattern(UserCommands.GetByOAuth)
  async getUserByOAuth(
    @Payload() payload: GetUserByOAuthDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.userService.getUserByOAuth(payload),
    );
  }

  @MessagePattern(UserCommands.GetByEmail)
  async getUserByEmail(
    @Payload() payload: GetUserByEmailDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.userService.getUserByEmail(payload),
    );
  }

  @MessagePattern(UserCommands.LinkWithOAuth)
  async linkUserWithOAuth(
    @Payload() payload: LinkUserWithOAuthDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.userService.linkUserWithOAuth(payload),
    );
  }

  @MessagePattern(UserCommands.CreateOAuth)
  async createUserOAuth(
    @Payload() payload: CreateUserOAuthDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.userService.createUserOAuth(payload),
    );
  }
}
