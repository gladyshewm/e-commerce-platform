import { Logger, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RmqModule } from '@app/rmq';
import { AUTH_SERVICE, USER_SERVICE } from '@app/common/constants';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TokenService } from './token.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenEntity } from '@app/common/database/entities';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmConfigModule } from '@app/common/database/config';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/auth/.env',
      validationSchema: Joi.object({
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_ACCESS_SECRET_EXPIRATION_TIME: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET_EXPIRATION_TIME: Joi.string().required(),
        RMQ_URI: Joi.string().required(),
        RMQ_AUTH_QUEUE: Joi.string().required(),
        RMQ_USER_QUEUE: Joi.string().required(),
        POSTGRES_HOST: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_DB: Joi.string().required(),
      }),
    }),
    TypeOrmConfigModule,
    TypeOrmModule.forFeature([TokenEntity]),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string | number>(
            'JWT_ACCESS_SECRET_EXPIRATION_TIME',
          ),
        },
      }),
      inject: [ConfigService],
    }),
    RmqModule.register({ name: USER_SERVICE }),
    RmqModule.register({ name: AUTH_SERVICE }),
    ScheduleModule.forRoot(),
  ],
  controllers: [AuthController],
  providers: [Logger, AuthService, TokenService],
})
export class AuthModule {}
