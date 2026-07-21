import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { DbService, LocalEmployee } from '../../../core/db.service';
import { TuiButton, TuiTextfield, TuiLabel } from '@taiga-ui/core';
import { TuiSelect } from '@taiga-ui/kit';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TuiButton,
    TuiTextfield,
    TuiLabel,
    TuiSelect
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly db = inject(DbService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  readonly employees = signal<LocalEmployee[]>([]);
  readonly selectedEmployeeCode = signal<string>('');
  readonly code = signal<string>('');
  readonly error = signal<string>('');
  readonly loading = signal<boolean>(false);

  async ngOnInit() {
    await this.refreshProfiles();
  }

  async refreshProfiles() {
    if (navigator.onLine) {
      try {
        const apiProfiles = await firstValueFrom(
          this.http.get<any[]>('http://localhost:5031/api/auth/profiles')
        );
        if (apiProfiles && apiProfiles.length > 0) {
          for (const p of apiProfiles) {
            const existing = await this.db.employees.get(p.id);
            if (existing) {
              await this.db.employees.update(p.id, {
                employeeCode: p.employeeCode,
                firstName: p.firstName,
                lastName: p.lastName,
                isTotpSetUp: p.isTotpSetUp,
                isActive: true
              });
            } else {
              await this.db.employees.put({
                id: p.id,
                storeId: '00000000-0000-0000-0000-000000000001',
                employeeCode: p.employeeCode,
                firstName: p.firstName,
                lastName: p.lastName,
                email: '',
                totpSecret: '',
                isTotpSetUp: p.isTotpSetUp,
                isActive: true
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to sync employee profiles from server', err);
      }
    }

    try {
      const allCached = await this.db.employees.toArray();
      const activeEmployees = allCached.filter(e => e.isActive === true || (e.isActive as any) === 1);
      this.employees.set(activeEmployees);
      if (activeEmployees.length > 0) {
        this.selectedEmployeeCode.set(activeEmployees[0].employeeCode);
      }
    } catch (err) {
      console.error('Failed to load employees', err);
    }
  }

  async onSubmit() {
    if (!this.selectedEmployeeCode() || this.code().length !== 6) {
      this.error.set('Please select an employee and enter a 6-digit code.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      const success = await this.authService.login(this.selectedEmployeeCode(), this.code());
      if (success) {
        this.router.navigate(['/']);
      } else {
        this.error.set('Invalid verification code. Please try again.');
      }
    } catch (err) {
      this.error.set('An error occurred. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
