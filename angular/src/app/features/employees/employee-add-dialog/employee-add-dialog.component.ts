import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TuiButton, TuiTextfield, TuiLabel, TuiLoader } from '@taiga-ui/core';
import { MessageService } from 'primeng/api';
import { DialogRef } from '@angular/cdk/dialog';

export interface RoleDto {
  id: number;
  name: string;
  description: string;
}

export interface EmployeeFormResult {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  isTotpSetUp: boolean;
  roles: string[];
}

@Component({
  selector: 'app-employee-add-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TuiButton,
    TuiTextfield,
    TuiLabel,
    TuiLoader
  ],
  templateUrl: './employee-add-dialog.component.html',
  styleUrl: './employee-add-dialog.component.scss'
})
export class EmployeeAddDialogComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly dialogRef = inject(DialogRef<EmployeeFormResult>);
  private readonly messages = inject(MessageService);

  readonly roles = signal<RoleDto[]>([]);
  readonly selectedRoleIds = signal<number[]>([]);

  readonly employeeCode = signal<string>('');
  readonly firstName = signal<string>('');
  readonly lastName = signal<string>('');
  readonly email = signal<string>('');
  readonly phone = signal<string>('');

  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly error = signal<string>('');

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.loading.set(true);
    this.http.get<RoleDto[]>('http://localhost:5031/api/employees/roles').subscribe({
      next: (data) => {
        this.roles.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load roles.');
        this.loading.set(false);
        this.messages.add({
          severity: 'error',
          summary: 'Roles unavailable',
          detail: 'Could not load available roles. Close and retry.',
          life: 5000
        });
      }
    });
  }

  toggleRole(roleId: number, checked: boolean) {
    if (checked) {
      this.selectedRoleIds.update(ids => [...ids, roleId]);
    } else {
      this.selectedRoleIds.update(ids => ids.filter(id => id !== roleId));
    }
  }

  onSubmit() {
    if (!this.employeeCode() || !this.firstName() || !this.lastName() || !this.email()) {
      this.error.set('Please fill out all required fields.');
      return;
    }
    if (this.selectedRoleIds().length === 0) {
      this.error.set('Please select at least one role.');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    this.http.post<EmployeeFormResult>('http://localhost:5031/api/employees', {
      storeId: '00000000-0000-0000-0000-000000000001',
      employeeCode: this.employeeCode(),
      firstName: this.firstName(),
      lastName: this.lastName(),
      email: this.email(),
      phone: this.phone() || null,
      roleIds: this.selectedRoleIds()
    }).subscribe({
      next: (result) => {
        this.saving.set(false);
        this.messages.add({
          severity: 'success',
          summary: 'Profile created',
          detail: `${result.firstName} ${result.lastName} is ready for onboarding.`,
          life: 4000
        });
        this.dialogRef.close(result);
      },
      error: (err) => {
        const message = err.error?.message || err.error || 'Failed to create employee profile.';
        this.error.set(typeof message === 'string' ? message : 'Failed to create employee profile.');
        this.saving.set(false);
        this.messages.add({
          severity: 'error',
          summary: 'Creation failed',
          detail: this.error(),
          life: 6000
        });
      }
    });
  }

  onCancel() {
    this.dialogRef.close(undefined);
  }
}
