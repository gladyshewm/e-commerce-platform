import { Logger, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ConfigModule } from '@nestjs/config';
import { RmqModule } from '@app/rmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity, UserOAuthEntity } from '@app/common/database/entities';
import { TypeOrmConfigModule } from '@app/common/database/config';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/user/.env',
      validationSchema: Joi.object({
        RMQ_URI: Joi.string().required(),
        RMQ_USER_QUEUE: Joi.string().required(),
        POSTGRES_HOST: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_DB: Joi.string().required(),
      }),
    }),
    TypeOrmConfigModule,
    TypeOrmModule.forFeature([UserEntity, UserOAuthEntity]),
    RmqModule,
  ],
  controllers: [UserController],
  providers: [Logger, UserService],
})
export class UserModule {}
