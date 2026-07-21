import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'auth/login', canActivate: [guestGuard], loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'invite/:token', loadComponent: () => import('./features/auth/totp-setup/totp-setup.component').then(m => m.TotpSetupComponent) },
  { path: '', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'inventory', canActivate: [authGuard], loadComponent: () => import('./features/inventory/inventory.component').then(m => m.InventoryComponent) },
  { path: 'employees', canActivate: [authGuard, adminGuard], loadComponent: () => import('./features/employees/employee-list/employee-list.component').then(m => m.EmployeeListComponent) },
  { path: '**', redirectTo: '' }
];
