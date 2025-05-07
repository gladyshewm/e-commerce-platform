import { JwtPayload } from '@app/common/contracts/auth';

export interface GetTokensPayload
  extends Pick<JwtPayload, 'userId' | 'username' | 'userRole'> {}
