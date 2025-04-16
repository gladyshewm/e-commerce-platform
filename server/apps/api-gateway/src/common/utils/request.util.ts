import { Request } from 'express';

export const extractRequestMeta = (req: Request) => ({
  userAgent: req.headers['user-agent'] ?? null,
  ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
  refreshToken: req.cookies['refreshToken'],
});
