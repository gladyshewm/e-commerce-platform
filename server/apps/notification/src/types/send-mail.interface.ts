import { Address } from '@nestjs-modules/mailer/dist/interfaces/send-mail-options.interface';

export interface SendMail {
  to: string | Address;
  subject: string;
  text: string;
}
