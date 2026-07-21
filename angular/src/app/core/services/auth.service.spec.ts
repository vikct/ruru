import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, LoginResponse } from './auth.service';
import { DbService, LocalEmployee } from '../db.service';
import * as OTPAuth from 'otpauth';
import { vi } from 'vitest';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let dbMock: any;

  beforeEach(() => {
    // Mock Dexie DbService using Vitest spies
    dbMock = {
      employees: {
        put: vi.fn().mockResolvedValue(undefined),
        where: vi.fn((key: string) => {
          return {
            equals: vi.fn((val: string) => {
              return {
                first: vi.fn().mockResolvedValue({
                  id: 'emp-uuid-123',
                  employeeCode: 'EMP-001',
                  firstName: 'John',
                  lastName: 'Doe',
                  email: 'john@rurupos.com',
                  totpSecret: 'NBSWY3DPEB3W64TBNQ', // admin12345
                  isActive: true,
                  isTotpSetUp: true
                } as LocalEmployee)
              };
            })
          };
        })
      }
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: DbService, useValue: dbMock }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // Clear local storage and service state between tests
    localStorage.clear();
    service.currentUser.set(null);
    service.currentRoles.set([]);
    service.accessToken.set(null);
    service.refreshToken.set(null);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login online and save token and user info', async () => {
    service.isOnline.set(true);

    const mockResponse: LoginResponse = {
      accessToken: 'mock_jwt_access_token',
      refreshToken: 'mock_jwt_refresh_token',
      employee: {
        id: 'emp-uuid-123',
        employeeCode: 'EMP-001',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['Admin']
      }
    };

    const loginPromise = service.login('EMP-001', '123456');

    const req = httpMock.expectOne('http://localhost:5031/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ employeeCode: 'EMP-001', code: '123456' });
    req.flush(mockResponse);

    const success = await loginPromise;
    expect(success).toBe(true);
    expect(service.accessToken()).toBe('mock_jwt_access_token');
    expect(service.refreshToken()).toBe('mock_jwt_refresh_token');
    expect(service.currentUser()?.firstName).toBe('John');
    expect(service.currentRoles()).toEqual(['Admin']);
    expect(dbMock.employees.put).toHaveBeenCalled();
  });

  it('should fallback to offline TOTP verification if offline', async () => {
    service.isOnline.set(false);

    // Generate valid TOTP token for secret 'NBSWY3DPEB3W64TBNQ' (admin12345)
    const totpObj = new OTPAuth.TOTP({
      issuer: 'RuruPOS',
      label: 'john@rurupos.com',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: 'NBSWY3DPEB3W64TBNQ'
    });
    const currentCode = totpObj.generate();

    const success = await service.login('EMP-001', currentCode);
    
    expect(success).toBe(true);
    expect(service.currentUser()?.firstName).toBe('John');
    expect(service.currentRoles()).toEqual(['Therapist']);
  });

  it('should fail offline login if TOTP code is incorrect', async () => {
    service.isOnline.set(false);

    const success = await service.login('EMP-001', '000000');
    
    expect(success).toBe(false);
    expect(service.currentUser()).toBeNull();
  });
});
