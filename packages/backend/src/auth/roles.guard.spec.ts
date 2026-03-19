import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  function createMockContext(user: unknown): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = createMockContext({ role: 'EMPFANG' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow PLATFORM_ADMIN to bypass all role checks', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    const ctx = createMockContext({ role: 'PLATFORM_ADMIN' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  describe('ADMIN role access', () => {
    const ctx = () => createMockContext({ role: 'ADMIN' });

    it('should access ADMIN-only endpoints', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
      expect(guard.canActivate(ctx())).toBe(true);
    });

    it('should access ADMIN+ARZT endpoints', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN', 'ARZT']);
      expect(guard.canActivate(ctx())).toBe(true);
    });

    it('should access ADMIN+ARZT+EMPFANG endpoints', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN', 'ARZT', 'EMPFANG']);
      expect(guard.canActivate(ctx())).toBe(true);
    });
  });

  describe('ARZT role access', () => {
    const ctx = () => createMockContext({ role: 'ARZT' });

    it('should be denied ADMIN-only endpoints', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
      expect(guard.canActivate(ctx())).toBe(false);
    });

    it('should access ADMIN+ARZT endpoints', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN', 'ARZT']);
      expect(guard.canActivate(ctx())).toBe(true);
    });

    it('should access ADMIN+ARZT+EMPFANG endpoints', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN', 'ARZT', 'EMPFANG']);
      expect(guard.canActivate(ctx())).toBe(true);
    });
  });

  describe('EMPFANG role access', () => {
    const ctx = () => createMockContext({ role: 'EMPFANG' });

    it('should be denied ADMIN-only endpoints', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
      expect(guard.canActivate(ctx())).toBe(false);
    });

    it('should be denied ADMIN+ARZT endpoints', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN', 'ARZT']);
      expect(guard.canActivate(ctx())).toBe(false);
    });

    it('should access ADMIN+ARZT+EMPFANG endpoints', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN', 'ARZT', 'EMPFANG']);
      expect(guard.canActivate(ctx())).toBe(true);
    });
  });

  it('should deny access when user has no role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    const ctx = createMockContext({});
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('should deny access when user is undefined', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    const ctx = createMockContext(undefined);
    expect(guard.canActivate(ctx)).toBe(false);
  });
});
