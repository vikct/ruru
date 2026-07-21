import { Injectable, signal, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DbService, LocalEmployee } from '../db.service';
import { Observable, from, of, firstValueFrom } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import * as OTPAuth from 'otpauth';

export interface EmployeeDto {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  roles: string[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  employee: EmployeeDto;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:5031/api/auth';
  private readonly http = inject(HttpClient);
  private readonly db = inject(DbService);

  readonly currentUser = signal<LocalEmployee | null>(null);
  readonly currentRoles = signal<string[]>([]);
  readonly isOnline = signal<boolean>(navigator.onLine);
  
  readonly accessToken = signal<string | null>(localStorage.getItem('ruru_access_token'));
  readonly refreshToken = signal<string | null>(localStorage.getItem('ruru_refresh_token'));

  private refreshTimeoutId: any;

  constructor() {
    window.addEventListener('online', () => this.isOnline.set(true));
    window.addEventListener('offline', () => this.isOnline.set(false));

    // Restore user session from localStorage on startup if present
    const savedUser = localStorage.getItem('ruru_user');
    const savedRoles = localStorage.getItem('ruru_roles');
    if (savedUser && savedRoles) {
      try {
        this.currentUser.set(JSON.parse(savedUser));
        this.currentRoles.set(JSON.parse(savedRoles));
        this.scheduleTokenRefresh();
      } catch {
        this.clearSession();
      }
    }

    // React to token changes to manage refresh schedule
    effect(() => {
      const token = this.accessToken();
      if (token && this.isOnline()) {
        this.scheduleTokenRefresh();
      } else {
        this.clearRefreshTimer();
      }
    });
  }

  async login(employeeCode: string, code: string): Promise<boolean> {
    if (this.isOnline()) {
      try {
        const response = await firstValueFrom(
          this.http.post<LoginResponse>(`${this.apiUrl}/login`, { employeeCode, code })
        );

        if (response) {
          const localEmployee: LocalEmployee = {
            id: response.employee.id,
            storeId: '00000000-0000-0000-0000-000000000001', // Default Store ID
            employeeCode: response.employee.employeeCode,
            firstName: response.employee.firstName,
            lastName: response.employee.lastName,
            email: '', // Not strictly needed offline for counter POS
            totpSecret: '', // Secret is not returned from API for security
            isTotpSetUp: true,
            isActive: true
          };

          this.saveSession(response.accessToken, response.refreshToken, localEmployee, response.employee.roles);
          
          // Seed the employee cache in IndexedDB
          await this.db.employees.put(localEmployee);
          
          return true;
        }
      } catch (error) {
        console.error('Login API error', error);
      }
    }

    // Offline or API failure: check cached employees in Dexie
    const cachedEmployee = await this.db.employees
      .where('employeeCode')
      .equals(employeeCode)
      .first();

    if (cachedEmployee && cachedEmployee.isActive && cachedEmployee.totpSecret) {
      try {
        const totp = new OTPAuth.TOTP({
          issuer: 'RuruPOS',
          label: cachedEmployee.email || cachedEmployee.employeeCode,
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          secret: cachedEmployee.totpSecret
        });

        const validation = totp.validate({ token: code, window: 1 });
        if (validation !== null) {
          // Mock local roles for offline POS (fallback to Therapist/Cashier if unknown)
          // In a real flow, the roles are cached in Dexie roles table or associated to employee
          const roles = ['Therapist']; // Default offline role
          this.saveSession('offline_access_token', 'offline_refresh_token', cachedEmployee, roles);
          return true;
        }
      } catch (totpError) {
        console.error('Local TOTP validation error', totpError);
      }
    }

    return false;
  }

  logout(): void {
    const token = this.refreshToken();
    if (token && this.isOnline()) {
      this.http.post(`${this.apiUrl}/logout`, { refreshToken: token }).subscribe();
    }
    this.clearSession();
  }

  private saveSession(access: string, refresh: string, employee: LocalEmployee, roles: string[]): void {
    localStorage.setItem('ruru_access_token', access);
    localStorage.setItem('ruru_refresh_token', refresh);
    localStorage.setItem('ruru_user', JSON.stringify(employee));
    localStorage.setItem('ruru_roles', JSON.stringify(roles));

    this.accessToken.set(access);
    this.refreshToken.set(refresh);
    this.currentUser.set(employee);
    this.currentRoles.set(roles);
  }

  private clearSession(): void {
    localStorage.removeItem('ruru_access_token');
    localStorage.removeItem('ruru_refresh_token');
    localStorage.removeItem('ruru_user');
    localStorage.removeItem('ruru_roles');

    this.accessToken.set(null);
    this.refreshToken.set(null);
    this.currentUser.set(null);
    this.currentRoles.set([]);
    
    this.clearRefreshTimer();
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
  }

  private scheduleTokenRefresh(): void {
    this.clearRefreshTimer();

    const token = this.accessToken();
    if (!token || token === 'offline_access_token') return;

    try {
      // Decode JWT payload to find expiration
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));
      const expTimestamp = decodedPayload.exp * 1000; // to ms
      const delay = expTimestamp - Date.now() - 2 * 60 * 1000; // Refresh 2 minutes before expiry

      if (delay > 0) {
        this.refreshTimeoutId = setTimeout(() => this.refreshTokenFlow(), delay);
      } else {
        this.refreshTokenFlow();
      }
    } catch {
      // Fallback: refresh in 10 minutes
      this.refreshTimeoutId = setTimeout(() => this.refreshTokenFlow(), 10 * 60 * 1000);
    }
  }

  private async refreshTokenFlow(): Promise<void> {
    const access = this.accessToken();
    const refresh = this.refreshToken();
    if (!access || !refresh || !this.isOnline()) return;

    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, { accessToken: access, refreshToken: refresh })
      );

      if (response) {
        const localEmployee: LocalEmployee = {
          id: response.employee.id,
          storeId: '00000000-0000-0000-0000-000000000001',
          employeeCode: response.employee.employeeCode,
          firstName: response.employee.firstName,
          lastName: response.employee.lastName,
          email: '',
          totpSecret: '',
          isTotpSetUp: true,
          isActive: true
        };
        this.saveSession(response.accessToken, response.refreshToken, localEmployee, response.employee.roles);
      }
    } catch (err) {
      console.error('Refresh token failed', err);
      this.clearSession();
    }
  }
}
