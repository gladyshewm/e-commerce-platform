import { Controller, Get, Param } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Controller()
export class ApiGatewayController {
  constructor(private readonly httpService: HttpService) {}

  @Get('/users/:id')
  async getUser(@Param('id') id: string) {
    const response = await this.httpService.axiosRef.get(
      `http://localhost:3001/users/${id}`,
    );
    return response.data;
  }
}
