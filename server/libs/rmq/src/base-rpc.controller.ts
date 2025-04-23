import { Logger } from '@nestjs/common';
import { RmqService } from './rmq.service';
import { RmqContext } from '@nestjs/microservices';

export abstract class BaseRpcController {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(readonly rmqService: RmqService) {}

  protected async handleMessage<T>(
    context: RmqContext,
    handler: () => Promise<T>,
  ): Promise<T> {
    try {
      const result = await handler();
      this.rmqService.ack(context);
      return result;
    } catch (err) {
      throw err;
    }
  }
}
