import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { seconds, Throttle } from '@nestjs/throttler';
import { lastValueFrom } from 'rxjs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { USER_SERVICE } from '@app/common/constants';
import { UserWithoutPassword } from '@app/common/contracts/user';
import { UserRole } from '@app/common/database/enums';
import { GetUserResponseDto } from './dto/user-get-response.dto';
import { GetUserDto } from './dto/user-get.dto';
import { UpdateUserRoleDto } from './dto/user-update-role.dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { CurrentUser, Roles } from '../common/decorators';
import { handleRpcError } from '../common/utils';
import { AuthenticatedUser } from '../common/types';
import { ActivateUserEmailQueryDto } from './dto/user-activate-email.dto';
import { ActivateUserEmailResponseDto } from './dto/user-activate-email-response.dto';
import { SendEmailActivationLinkDto } from './dto/user-send-email-activation-link.dto';
import { SendEmailActivationLinkResponseDto } from './dto/user-send-email-activation-link-response.dto';

@ApiTags('users')
@Throttle({ default: { ttl: seconds(60), limit: 100 } })
@Controller('users')
export class UserController {
  constructor(
    @Inject(USER_SERVICE) private readonly userServiceClient: ClientProxy,
  ) {}

  @Get('activate')
  @ApiResponse({
    status: 200,
    type: ActivateUserEmailResponseDto,
    description: 'Email has been successfully activated',
  })
  @ApiResponse({
    status: 400,
    description: 'Email verification token is invalid or expired',
  })
  async activateUserEmail(
    @Query() query: ActivateUserEmailQueryDto,
  ): Promise<ActivateUserEmailResponseDto> {
    await lastValueFrom(
      this.userServiceClient
        .send('activate_user_email', query)
        .pipe(handleRpcError()),
    );

    return { message: 'Email has been successfully activated' };
  }

  // если прошлый link истёк
  @Post('email-activation-link')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 201,
    type: SendEmailActivationLinkResponseDto,
    description: 'Activation email link has been successfully sent',
  })
  @ApiResponse({
    status: 400,
    description: 'This email is already verified',
  })
  @ApiBearerAuth()
  async sendEmailActivationLink(
    @Body() dto: SendEmailActivationLinkDto, // TODO: или доставать из req.user?
  ): Promise<SendEmailActivationLinkResponseDto> {
    await lastValueFrom(
      this.userServiceClient
        .send('send_email_activation_link', dto)
        .pipe(handleRpcError()),
    );

    return { message: 'Activation email link has been successfully sent' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({
    status: 200,
    type: GetUserResponseDto,
    description: 'Current user profile has been successfully retrieved',
  })
  @ApiBearerAuth()
  async getMe(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GetUserResponseDto> {
    return lastValueFrom<UserWithoutPassword>(
      this.userServiceClient
        .send('get_user_by_id', { id: user.id })
        .pipe(handleRpcError()),
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({
    status: 200,
    type: GetUserResponseDto,
    description: 'User has been successfully found',
  })
  @ApiBearerAuth()
  async getUser(@Param() dto: GetUserDto): Promise<GetUserResponseDto> {
    return lastValueFrom<UserWithoutPassword>(
      this.userServiceClient.send('get_user_by_id', dto).pipe(handleRpcError()),
    );
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user role' })
  @ApiResponse({
    status: 200,
    type: GetUserResponseDto,
    description: 'User role has been successfully changed',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiBearerAuth()
  async updateRole(
    @Param() params: GetUserDto,
    @Body() dto: UpdateUserRoleDto,
  ): Promise<GetUserResponseDto> {
    return lastValueFrom<UserWithoutPassword>(
      this.userServiceClient
        .send('update_user_role', { userId: params.id, role: dto.role })
        .pipe(handleRpcError()),
    );
  }
}
