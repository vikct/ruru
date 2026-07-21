import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TuiButton, TuiTextfield, TuiLabel, TuiLoader, TuiNotificationService } from '@taiga-ui/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { RoleDto, EmployeeFormResult, EmployeeDetailsDto } from '../shared/employee.models';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TuiButton,
    TuiTextfield,
    TuiLabel,
    TuiLoader
  ],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.scss'
})
export class EmployeeFormComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly dialogRef = inject(DialogRef<EmployeeFormResult>);
  private readonly data = inject<{ employeeId?: string }>(DIALOG_DATA, { optional: true });
  private readonly alerts = inject(TuiNotificationService);

  readonly roles = signal<RoleDto[]>([]);
  readonly selectedRoleIds = signal<number[]>([]);

  readonly employeeCode = signal<string>('');
  readonly firstName = signal<string>('');
  readonly lastName = signal<string>('');
  readonly email = signal<string>('');
  readonly phone = signal<string>('');

  readonly isEditMode = signal<boolean>(false);
  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly error = signal<string>('');

  ngOnInit() {
    const empId = this.data?.employeeId;
    if (empId) {
      this.isEditMode.set(true);
    }

    this.loadRoles().then(() => {
      if (this.isEditMode() && empId) {
        this.loadEmployeeDetails(empId);
      }
    });
  }

  async loadRoles() {
    this.loading.set(true);
    return new Promise<void>((resolve) => {
      this.http.get<RoleDto[]>('http://localhost:5031/api/employees/roles').subscribe({
        next: (data) => {
          this.roles.set(data);
          this.loading.set(false);
          resolve();
        },
        error: () => {
          this.error.set('Failed to load store roles.');
          this.loading.set(false);
          resolve();
        }
      });
    });
  }

  loadEmployeeDetails(employeeId: string) {
    this.loading.set(true);
    this.http.get<EmployeeDetailsDto>(`http://localhost:5031/api/employees/${employeeId}`).subscribe({
      next: (data) => {
        this.employeeCode.set(data.employeeCode);
        this.firstName.set(data.firstName);
        this.lastName.set(data.lastName);
        this.email.set(data.email);
        this.phone.set(data.phone || '');

        // Match string roles with role IDs
        const matchedIds: number[] = [];
        this.roles().forEach(r => {
          if (data.roles.includes(r.name)) {
            matchedIds.push(r.id);
          }
        });
        this.selectedRoleIds.set(matchedIds);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load employee details.');
        this.loading.set(false);
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

    const payload = {
      storeId: '00000000-0000-0000-0000-000000000001',
      employeeCode: this.employeeCode(),
      firstName: this.firstName(),
      lastName: this.lastName(),
      email: this.email(),
      phone: this.phone() || null,
      roleIds: this.selectedRoleIds()
    };

    if (this.isEditMode()) {
      const empId = this.data?.employeeId;
      this.http.put<EmployeeFormResult>(`http://localhost:5031/api/employees/${empId}`, payload).subscribe({
        next: (result) => {
          this.saving.set(false);
          this.alerts.open(`${result.firstName} ${result.lastName} updated successfully.`, {
            label: 'Profile Updated',
            appearance: 'success'
          }).subscribe();
          this.dialogRef.close(result);
        },
        error: (err) => {
          const message = err.error?.message || err.error || 'Failed to update employee details.';
          this.error.set(typeof message === 'string' ? message : 'Failed to update employee details.');
          this.saving.set(false);
        }
      });
    } else {
      this.http.post<EmployeeFormResult>('http://localhost:5031/api/employees', payload).subscribe({
        next: (result) => {
          this.saving.set(false);
          this.alerts.open(`${result.firstName} ${result.lastName} created successfully.`, {
            label: 'Profile Created',
            appearance: 'success'
          }).subscribe();
          this.dialogRef.close(result);
        },
        error: (err) => {
          const message = err.error?.message || err.error || 'Failed to create employee profile.';
          this.error.set(typeof message === 'string' ? message : 'Failed to create employee profile.');
          this.saving.set(false);
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close(undefined);
  }
}
