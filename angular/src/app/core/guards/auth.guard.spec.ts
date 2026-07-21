import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard, guestGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { vi, describe, beforeEach, it, expect } from 'vitest';

describe('Auth Guards', () => {
  let authServiceMock: any;
  let routerMock: any;

  beforeEach(() => {
    authServiceMock = {
      currentUser: vi.fn()
    };
    
    routerMock = {
      createUrlTree: vi.fn().mockImplementation((commands) => ({ commands }))
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });
  });

  describe('authGuard', () => {
    it('should return true if user is logged in', () => {
      authServiceMock.currentUser.mockReturnValue({ id: 'emp-123' });
      const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toBe(true);
    });

    it('should return UrlTree to login page if user is not logged in', () => {
      authServiceMock.currentUser.mockReturnValue(null);
      const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toEqual({ commands: ['/auth/login'] });
      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('guestGuard', () => {
    it('should return true if user is not logged in', () => {
      authServiceMock.currentUser.mockReturnValue(null);
      const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
      expect(result).toBe(true);
    });

    it('should return UrlTree to home page if user is logged in', () => {
      authServiceMock.currentUser.mockReturnValue({ id: 'emp-123' });
      const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
      expect(result).toEqual({ commands: ['/'] });
      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/']);
    });
  });
});
