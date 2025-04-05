import { RmqOptions, Transport } from '@nestjs/microservices';

export const getRmqOptions = (uri: string, queue: string): RmqOptions => ({
  transport: Transport.RMQ,
  options: {
    urls: [uri],
    queue,
    noAck: false,
    persistent: true,
  },
});
