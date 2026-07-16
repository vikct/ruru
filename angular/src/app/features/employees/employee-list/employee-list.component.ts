import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TuiButton } from '@taiga-ui/core';
import { MessageService } from 'primeng/api';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { EmployeeAddDialogComponent, EmployeeFormResult } from '../employee-add-dialog/employee-add-dialog.component';

export interface EmployeeListDto {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  isTotpSetUp: boolean;
}

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TuiButton
  ],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss'
})
export class EmployeeListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(Dialog);
  private readonly messages = inject(MessageService);

  readonly employees = signal<EmployeeListDto[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string>('');

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.loading.set(true);
    this.error.set('');
    this.http.get<EmployeeListDto[]>('http://localhost:5031/api/employees').subscribe({
      next: (data) => {
        this.employees.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load employees. Make sure you are logged in as an Admin.');
        this.loading.set(false);
        this.messages.add({
          severity: 'error',
          summary: 'Load failed',
          detail: 'Could not load employees. Please verify your admin permissions.',
          life: 5000
        });
      }
    });
  }

  sendInvite(employee: EmployeeListDto) {
    this.http.post<{ inviteLink: string }>(`http://localhost:5031/api/employees/${employee.id}/invite`, {}).subscribe({
      next: (res) => {
        this.messages.add({
          severity: 'info',
          summary: 'Invite link generated',
          detail: `Share with ${employee.firstName} ${employee.lastName}: ${res.inviteLink}`,
          life: 8000
        });
      },
      error: () => {
        this.messages.add({
          severity: 'error',
          summary: 'Invite failed',
          detail: 'Failed to generate invite link. Please try again.',
          life: 5000
        });
      }
    });
  }

  toggleStatus(employee: EmployeeListDto) {
    const newStatus = !employee.isActive;
    this.http.patch(`http://localhost:5031/api/employees/${employee.id}/status`, {
      isActive: newStatus
    }).subscribe({
      next: () => {
        this.employees.update(list =>
          list.map(e => e.id === employee.id ? { ...e, isActive: newStatus } : e)
        );
        this.messages.add({
          severity: newStatus ? 'success' : 'warn',
          summary: newStatus ? 'Employee activated' : 'Employee deactivated',
          detail: `${employee.firstName} ${employee.lastName} is now ${newStatus ? 'active' : 'inactive'}.`,
          life: 3500
        });
      },
      error: () => {
        this.messages.add({
          severity: 'error',
          summary: 'Update failed',
          detail: 'Failed to update employee status. Please try again.',
          life: 5000
        });
      }
    });
  }

  openAddDialog() {
    const ref = this.dialog.open<EmployeeFormResult>(EmployeeAddDialogComponent, {
      width: '580px',
      maxWidth: '95vw',
      disableClose: false
    }) as DialogRef<EmployeeFormResult>;

    ref.closed.subscribe((result: EmployeeFormResult | undefined) => {
      if (result) {
        const newEmployee: EmployeeListDto = {
          id: result.id,
          employeeCode: result.employeeCode,
          firstName: result.firstName,
          lastName: result.lastName,
          email: result.email,
          phone: result.phone,
          isActive: result.isActive,
          isTotpSetUp: result.isTotpSetUp
        };
        this.employees.update(list => [newEmployee, ...list]);
        this.messages.add({
          severity: 'success',
          summary: 'Employee created',
          detail: `${result.firstName} ${result.lastName} (${result.employeeCode}) added successfully.`,
          life: 4000
        });
      }
    });
  }
}
