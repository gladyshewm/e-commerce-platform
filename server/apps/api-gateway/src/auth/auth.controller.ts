import {
  Body,
  Controller,
  HttpException,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LocalAuthGuard } from '@app/common/auth';
import { CurrentUser } from '@app/common/decorators';
import { catchError, lastValueFrom } from 'rxjs';
import { AUTH_SERVICE } from '@app/common/constants';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/auth-login.dto';
import { LoginResponseDto } from './dto/auth-login-response.dto';
import { RegisterDto } from './dto/auth-register.dto';
import { User } from '@app/common/contracts/user';
import { LoginResponse } from '@app/common/contracts/auth';
import { RegisterResponseDto } from './dto/auth-register-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authServiceClient: ClientProxy,
  ) {}

  @ApiOperation({ summary: 'Register new user and return tokens' })
  @ApiResponse({
    status: 201,
    type: RegisterResponseDto,
    description: 'User registered and authenticated',
  })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    return lastValueFrom(
      this.authServiceClient.send('register', dto).pipe(
        catchError((error) => {
          throw new HttpException(error.message, error.statusCode);
        }),
      ),
    );
  }

  @ApiOperation({ summary: 'User authorization' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    type: LoginResponseDto,
    description: 'User authorized',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@CurrentUser() user: User): Promise<LoginResponseDto> {
    return lastValueFrom<LoginResponse>(
      this.authServiceClient.send('login', user),
    );
  }
}
