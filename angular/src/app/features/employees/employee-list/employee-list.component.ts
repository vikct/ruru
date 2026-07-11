import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TuiButton } from '@taiga-ui/core';

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
  private readonly router = inject(Router);

  readonly employees = signal<EmployeeListDto[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string>('');
  readonly inviteLink = signal<string>('');
  readonly inviteEmployeeName = signal<string>('');

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
      error: (err) => {
        this.error.set('Failed to load employees. Make sure you are logged in as an Admin.');
        this.loading.set(false);
      }
    });
  }

  sendInvite(employee: EmployeeListDto) {
    this.inviteLink.set('');
    this.inviteEmployeeName.set('');
    this.http.post<{ inviteLink: string }>(`http://localhost:5031/api/employees/${employee.id}/invite`, {}).subscribe({
      next: (res) => {
        this.inviteEmployeeName.set(`${employee.firstName} ${employee.lastName}`);
        this.inviteLink.set(res.inviteLink);
      },
      error: (err) => {
        alert('Failed to generate invite link.');
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
      },
      error: (err) => {
        alert('Failed to update employee status.');
      }
    });
  }
}
