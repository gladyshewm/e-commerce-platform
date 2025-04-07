import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@app/common/auth';
import { User } from '@app/common/contracts';
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

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    @Inject(USER_SERVICE) private readonly userServiceClient: ClientProxy,
  ) {}

  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({
    status: 200,
    type: GetUserResponseDto,
    description: 'Found user',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUser(@Param() dto: GetUserDto): Promise<GetUserResponseDto> {
    const user = await lastValueFrom<User>(
      this.userServiceClient.send('get_user_by_id', dto),
    );
    return user;
  }
}
