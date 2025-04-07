import { Injectable, OnModuleInit } from '@nestjs/common';
import { User } from '@app/common/contracts';
import * as bcrypt from 'bcrypt';
import {
  CreateUserPayload,
  GetUserByIdPayload,
  GetUserByNamePayload,
} from '@app/common/contracts/user';

@Injectable()
export class UserService implements OnModuleInit {
  async onModuleInit() {
    // FIXME: temp
    const [hashed1, hashed2] = [
      await bcrypt.hash('changeme', 10),
      await bcrypt.hash('guess', 10),
    ];
    this.users[0].password = hashed1;
    this.users[1].password = hashed2;
  }

  private readonly users: User[] = [
    {
      userId: 1,
      username: 'john',
      password: 'changeme',
    },
    {
      userId: 2,
      username: 'maria',
      password: 'guess',
    },
  ];

  async createUser(payload: CreateUserPayload): Promise<User> {
    const { username, password: rawPassword } = payload;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const user = {
      userId: this.users.length + 1,
      username,
      password: hashedPassword,
    };
    this.users.push(user);
    const { password, ...result } = user;
    return result;
  }

  async getUserById(payload: GetUserByIdPayload): Promise<User> {
    const { id } = payload;
    const user = this.users.find((user) => user.userId === +id);
    if (!user) return null;
    const { password, ...result } = user;
    return result;
  }

  async getUserByName(payload: GetUserByNamePayload): Promise<User> {
    const { username: name } = payload;
    const user = this.users.find((user) => user.username === name);
    if (!user) return null;
    return user;
  }
}
