import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TuiButton, TuiIcon, TuiNotificationService, TuiHint } from '@taiga-ui/core';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { EmployeeFormComponent } from '../employee-form/employee-form.component';
import { EmployeeListDto, EmployeeFormResult } from '../shared/employee.models';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    TuiButton,
    TuiIcon,
    TuiHint
  ],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss'
})
export class EmployeeListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(Dialog);
  private readonly alerts = inject(TuiNotificationService);

  readonly Math = Math;

  readonly employees = signal<EmployeeListDto[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string>('');

  readonly page = signal<number>(1);
  readonly pageSize = signal<number>(5);

  readonly paginatedEmployees = computed(() => {
    const list = this.employees();
    const startIndex = (this.page() - 1) * this.pageSize();
    return list.slice(startIndex, startIndex + this.pageSize());
  });

  readonly totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.employees().length / this.pageSize()));
  });

  readonly pagesArray = computed(() => {
    const total = this.totalPages();
    const arr = [];
    for (let i = 1; i <= total; i++) {
      arr.push(i);
    }
    return arr;
  });

  setPage(p: number) {
    if (p >= 1 && p <= this.totalPages()) {
      this.page.set(p);
    }
  }

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
        this.alerts.open('Could not load employees. Please verify your admin permissions.', {
          label: 'Load failed',
          appearance: 'error'
        }).subscribe();
      }
    });
  }

  sendInvite(employee: EmployeeListDto) {
    this.http.post<{ inviteLink: string }>(`http://localhost:5031/api/employees/${employee.id}/invite`, {}).subscribe({
      next: (res) => {
        this.alerts.open(`Share with ${employee.firstName} ${employee.lastName}: ${res.inviteLink}`, {
          label: 'Invite link generated',
          appearance: 'info'
        }).subscribe();
      },
      error: () => {
        this.alerts.open('Failed to generate invite link. Please try again.', {
          label: 'Invite failed',
          appearance: 'error'
        }).subscribe();
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
        this.alerts.open(`${employee.firstName} ${employee.lastName} is now ${newStatus ? 'active' : 'inactive'}.`, {
          label: newStatus ? 'Employee activated' : 'Employee deactivated',
          appearance: newStatus ? 'success' : 'warning'
        }).subscribe();
      },
      error: () => {
        this.alerts.open('Failed to update employee status. Please try again.', {
          label: 'Update failed',
          appearance: 'error'
        }).subscribe();
      }
    });
  }

  openAddDialog() {
    const ref = this.dialog.open<EmployeeFormResult>(EmployeeFormComponent, {
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
      }
    });
  }

  openEditDialog(employee: EmployeeListDto) {
    const ref = this.dialog.open<EmployeeFormResult>(EmployeeFormComponent, {
      width: '580px',
      maxWidth: '95vw',
      disableClose: false,
      data: { employeeId: employee.id }
    }) as DialogRef<EmployeeFormResult>;

    ref.closed.subscribe((result: EmployeeFormResult | undefined) => {
      if (result) {
        this.employees.update(list =>
          list.map(e => e.id === employee.id ? {
            ...e,
            employeeCode: result.employeeCode,
            firstName: result.firstName,
            lastName: result.lastName,
            email: result.email,
            phone: result.phone,
            isActive: result.isActive,
            isTotpSetUp: result.isTotpSetUp
          } : e)
        );
      }
    });
  }
}
