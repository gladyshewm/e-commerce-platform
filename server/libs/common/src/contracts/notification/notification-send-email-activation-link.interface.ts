export interface SendEmailActivationLinkPayload {
  userId: number;
  username: string;
  token: string;
}
