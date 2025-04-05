import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ConfigModule } from '@nestjs/config';
import { RmqModule } from '../../../libs/rmq/src';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/user/.env',
    }),
    RmqModule,
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
