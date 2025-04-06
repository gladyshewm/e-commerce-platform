import { Logger } from '@nestjs/common';
import { RmqService } from './rmq.service';
import { RmqContext } from '@nestjs/microservices';

export abstract class BaseRpcController {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(private readonly rmqService: RmqService) {}

  protected async handleMessage<T>(
    context: RmqContext,
    handler: () => Promise<T>,
  ): Promise<T> {
    try {
      const res = await handler();
      return res;
    } catch (err) {
      this.logger.error(`Error in ${this.constructor.name}: ${err.message}`);
      throw err;
    } finally {
      this.rmqService.ack(context);
    }
  }
}
