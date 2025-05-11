import { Request } from 'express';

export interface RequestMeta {
  userAgent: string | null;
  ipAddress: string | null;
  refreshToken: string | null;
}

export const extractRequestMeta = (req: Request): RequestMeta => {
  const userAgent =
    typeof req.headers['user-agent'] === 'string'
      ? req.headers['user-agent']
      : null;

  const forwardedFor = req.headers['x-forwarded-for'];
  const ipAddress =
    typeof forwardedFor === 'string'
      ? forwardedFor.split(',')[0].trim()
      : (req.ip ?? null);

  const refreshToken = req.cookies?.refreshToken ?? null;

  return {
    userAgent,
    ipAddress,
    refreshToken,
  };
};
