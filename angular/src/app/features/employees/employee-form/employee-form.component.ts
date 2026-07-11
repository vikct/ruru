import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TuiButton, TuiTextfield, TuiLabel } from '@taiga-ui/core';

export interface RoleDto {
  id: number;
  name: string;
  description: string;
}

export interface EmployeeDetailsDto {
  id: string;
  storeId: string;
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
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TuiButton,
    TuiTextfield,
    TuiLabel
  ],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.scss'
})
export class EmployeeFormComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

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

  private employeeId: string | null = null;

  ngOnInit() {
    this.employeeId = this.route.snapshot.paramMap.get('id');
    if (this.employeeId && this.employeeId !== 'new') {
      this.isEditMode.set(true);
    }
    
    this.loadRoles().then(() => {
      if (this.isEditMode()) {
        this.loadEmployeeDetails();
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
        error: (err) => {
          this.error.set('Failed to load store roles.');
          this.loading.set(false);
          resolve();
        }
      });
    });
  }

  loadEmployeeDetails() {
    this.loading.set(true);
    this.http.get<EmployeeDetailsDto>(`http://localhost:5031/api/employees/${this.employeeId}`).subscribe({
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
      error: (err) => {
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
      storeId: '00000000-0000-0000-0000-000000000001', // Default Store ID
      employeeCode: this.employeeCode(),
      firstName: this.firstName(),
      lastName: this.lastName(),
      email: this.email(),
      phone: this.phone() || null,
      roleIds: this.selectedRoleIds()
    };

    if (this.isEditMode()) {
      this.http.put(`http://localhost:5031/api/employees/${this.employeeId}`, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/employees']);
        },
        error: (err) => {
          this.error.set(err.error || 'Failed to update employee details.');
          this.saving.set(false);
        }
      });
    } else {
      this.http.post('http://localhost:5031/api/employees', payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/employees']);
        },
        error: (err) => {
          this.error.set(err.error || 'Failed to create employee profile.');
          this.saving.set(false);
        }
      });
    }
  }
}
