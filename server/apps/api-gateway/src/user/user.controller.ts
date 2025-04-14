import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@app/common/auth';
import { User, UserWithoutPassword } from '@app/common/contracts/user';
import { lastValueFrom } from 'rxjs';
import { USER_SERVICE } from '@app/common/constants';
import { ClientProxy } from '@nestjs/microservices';
import { GetUserDto } from './dto/user-get.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUserResponseDto } from './dto/user-get-response.dto';
import { handleRpcError } from '../utils/rpc-exception.utils';
import { CurrentUser } from '../decorators/user.decorator';
import { seconds, Throttle } from '@nestjs/throttler';

@ApiTags('users')
@Throttle({ default: { ttl: seconds(60), limit: 100 } })
@Controller('users')
export class UserController {
  constructor(
    @Inject(USER_SERVICE) private readonly userServiceClient: ClientProxy,
  ) {}

  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({
    status: 200,
    type: GetUserResponseDto,
    description: 'Current user profile has been successfully retrieved',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(
    @CurrentUser() user: Pick<User, 'id' | 'username'>,
  ): Promise<GetUserResponseDto> {
    return lastValueFrom<UserWithoutPassword>(
      this.userServiceClient
        .send('get_user_by_id', { id: user.id })
        .pipe(handleRpcError()),
    );
  }

  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({
    status: 200,
    type: GetUserResponseDto,
    description: 'User has been successfully found',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUser(@Param() dto: GetUserDto): Promise<GetUserResponseDto> {
    return lastValueFrom<UserWithoutPassword>(
      this.userServiceClient.send('get_user_by_id', dto).pipe(handleRpcError()),
    );
  }
}
