import { Controller } from '@nestjs/common';
import { PaymentService } from './payment.service';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { BaseRpcController, RmqService } from '@app/rmq';
import { ChargePaymentDto } from './dto/payment-charge.dto';
import { RefundPaymentDto } from './dto/payment-refund.dto';

@Controller()
export class PaymentController extends BaseRpcController {
  constructor(
    rmqService: RmqService,
    private readonly paymentService: PaymentService,
  ) {
    super(rmqService);
  }

  @MessagePattern('charge_payment')
  async chargePayment(
    @Payload() payload: ChargePaymentDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.paymentService.chargePayment(payload),
    );
  }

  @MessagePattern('refund_payment')
  async refundPayment(
    @Payload() payload: RefundPaymentDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.paymentService.refundPayment(payload),
    );
  }
}
