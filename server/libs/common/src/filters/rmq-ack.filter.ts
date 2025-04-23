import { Catch, ExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { throwError } from 'rxjs';

@Catch(RpcException)
export class RmqAckFilter implements ExceptionFilter {
  catch(exception: RpcException, host: any) {
    const ctx = host.switchToRpc().getContext();
    const channel = ctx.getChannelRef();
    const message = ctx.getMessage();

    channel.ack(message);
    return throwError(() => exception.getError());
  }
}
