import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'inventory', loadComponent: () => import('./features/inventory/inventory.component').then(m => m.InventoryComponent) },
  { path: 'auth/login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'invite/:token', loadComponent: () => import('./features/auth/totp-setup/totp-setup.component').then(m => m.TotpSetupComponent) },
  { 
    path: 'employees', 
    canActivate: [adminGuard],
    loadComponent: () => import('./features/employees/employee-list/employee-list.component').then(m => m.EmployeeListComponent) 
  },
  { 
    path: 'employees/new', 
    canActivate: [adminGuard],
    loadComponent: () => import('./features/employees/employee-form/employee-form.component').then(m => m.EmployeeFormComponent) 
  },
  { 
    path: 'employees/:id/edit', 
    canActivate: [adminGuard],
    loadComponent: () => import('./features/employees/employee-form/employee-form.component').then(m => m.EmployeeFormComponent) 
  },
  { path: '**', redirectTo: '' }
];
