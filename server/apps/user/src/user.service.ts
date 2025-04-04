import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  async getUser(id: string) {
    return `user ${id}`;
  }
}
