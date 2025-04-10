import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { RmqService } from './rmq.service';
import { RmqContext, RpcException } from '@nestjs/microservices';

export abstract class BaseRpcController {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(readonly rmqService: RmqService) {}

  protected async handleMessage<T>(
    context: RmqContext,
    handler: () => Promise<T>,
  ): Promise<T> {
    try {
      return await handler();
    }
    //  catch (err) {
    //   this.logger.error(
    //     `Error in ${this.constructor.name}: ${err.message}`,
    //     err.stack,
    //   );

    //   throw err;

    //   if (err instanceof RpcException) throw err;

    //   if (err instanceof HttpException) {
    //     const response = err.getResponse();
    //     throw new RpcException(
    //       typeof response === 'string'
    //         ? { message: response, statusCode: err.getStatus() }
    //         : { ...response, statusCode: err.getStatus() },
    //     );
    //   }

    //   throw new RpcException({
    //     message: err.message,
    //     statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    //   });
    // } 
    finally {
      this.rmqService.ack(context);
    }
  }
}
