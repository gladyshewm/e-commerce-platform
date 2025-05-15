import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, lastValueFrom } from 'rxjs';
import { MailerService } from '@nestjs-modules/mailer';
import { NotificationSender } from '../../types/notification-sender.interface';
import { SendNotificationPayload } from '../../types/send-notification.interface';
import { USER_SERVICE } from '@app/common/constants';
import { UserWithoutPassword } from '@app/common/contracts/user';

@Injectable()
export class EmailNotificationSender implements NotificationSender {
  private readonly logger = new Logger(EmailNotificationSender.name);

  constructor(
    private readonly mailerService: MailerService,
    @Inject(USER_SERVICE)
    private readonly userServiceClient: ClientProxy,
  ) {}

  private async getUserEmail(userId: number): Promise<string> {
    const user = await lastValueFrom(
      this.userServiceClient
        .send<UserWithoutPassword>('get_user_by_id', {
          id: userId,
        })
        .pipe(
          catchError((error) => {
            throw new RpcException({
              message: error.message,
              statusCode: error.statusCode,
            });
          }),
        ),
    );
    return user.email;
  }

  async send(payload: SendNotificationPayload): Promise<void> {
    const { userId, subject, content } = payload;
    const to = await this.getUserEmail(userId);
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        text: content,
      });
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw new Error(`Failed to send email to ${to}: ${error.message}`);
    }
  }
}
