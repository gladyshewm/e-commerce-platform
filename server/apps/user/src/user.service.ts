import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  CreateUserPayload,
  GetUserByIdPayload,
  GetUserByNamePayload,
} from '@app/common/contracts/user';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async createUser(
    payload: CreateUserPayload,
  ): Promise<Omit<UserEntity, 'password'>> {
    const existingUser = await this.userRepository.findOneBy({
      username: payload.username,
    });

    if (existingUser) {
      this.logger.error('User already exists');
      throw new RpcException({
        message: 'User already exists',
        statusCode: HttpStatus.CONFLICT,
      });
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const user = this.userRepository.create({
      username: payload.username,
      password: hashedPassword,
    });
    const saved = await this.userRepository.save(user);
    const { password, ...result } = saved;

    return result;
  }

  async getUserById(
    payload: GetUserByIdPayload,
  ): Promise<Omit<UserEntity, 'password'>> {
    const { id } = payload;
    const user = await this.userRepository.findOneBy({ id: +id });

    if (!user) {
      this.logger.warn(`User with id ${id} not found`);
      return null;
    }

    const { password, ...result } = user;
    return result;
  }

  async getUserByName(
    payload: GetUserByNamePayload,
  ): Promise<UserEntity | null> {
    const user = await this.userRepository.findOneBy({
      username: payload.username,
    });

    if (!user) {
      this.logger.warn(`User with username ${payload.username} not found`);
      return null;
    }

    return user;
  }
}
