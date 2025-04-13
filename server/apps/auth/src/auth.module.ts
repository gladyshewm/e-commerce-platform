import { Logger, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RmqModule } from '@app/rmq';
import { AUTH_SERVICE, USER_SERVICE } from '@app/common/constants';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy, LocalStrategy } from '@app/common/auth';
import { PassportModule } from '@nestjs/passport';
import { TokenService } from './token.service';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { TokenEntity, UserEntity } from '@app/common/entities';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/auth/.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
        type: 'postgres',
        host: configService.get<string>('POSTGRES_HOST'),
        port: +configService.get<string>('POSTGRES_PORT'),
        username: configService.get<string>('POSTGRES_USER'),
        password: configService.get<string>('POSTGRES_PASSWORD'),
        database: configService.get<string>('POSTGRES_DB'),
        entities: [UserEntity, TokenEntity],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
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
  providers: [Logger, JwtStrategy, LocalStrategy, AuthService, TokenService],
})
export class AuthModule {}
