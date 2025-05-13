import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '@app/common/database/enums';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as jest.Mocked<Reflector>;

  beforeEach(() => {
    guard = new RolesGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true if no roles are required', () => {
      const context = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({ getRequest: () => ({}) }),
      } as unknown as ExecutionContext;
      reflector.getAllAndOverride.mockReturnValue([]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true if the user has the required role', () => {
      const context = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: UserRole.ADMIN } }),
        }),
      } as unknown as ExecutionContext;
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw ForbiddenException if there is no user in the request', () => {
      const context = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
      } as unknown as ExecutionContext;
      reflector.getAllAndOverride.mockReturnValue([UserRole.MANAGER]);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if the user does not have the required role', () => {
      const context = {
        getHandler: () => {},
        getClass: () => {},
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: UserRole.CUSTOMER } }),
        }),
      } as unknown as ExecutionContext;
      reflector.getAllAndOverride.mockReturnValue([UserRole.MANAGER]);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
