import { Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from '@app/common/auth';
import { CurrentUser } from '@app/common/decorators';
import { LoginResponse, User } from '@app/common/contracts';
import { lastValueFrom } from 'rxjs';
import { AUTH_SERVICE } from '@app/common/constants';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/auth-login.dto';
import { LoginResponseDto } from './dto/auth-login-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authServiceClient: ClientProxy,
  ) {}

  @ApiOperation({ summary: 'User authorization' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    type: LoginResponseDto,
    description: 'User authorized',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@CurrentUser() user: User): Promise<LoginResponseDto> {
    const jwt = await lastValueFrom<LoginResponse>(
      this.authServiceClient.send('login', user),
    );
    return jwt;
  }
}
