import { Component, model, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { AuthService } from '../../services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TooltipModule, AvatarModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  host: {
    '[class.open]': 'isMobileOpen()'
  }
})
export class AppSidebarComponent {
  readonly collapsed = model.required<boolean>();
  readonly isMobileOpen = model.required<boolean>();

  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
  
  readonly userRole = computed(() => {
    const roles = this.authService.currentRoles();
    return roles.length > 0 ? roles[0] : 'Employee';
  });

  readonly avatarLabel = computed(() => {
    const user = this.currentUser();
    if (!user) return '??';
    const first = user.firstName ? user.firstName[0] : '';
    const last = user.lastName ? user.lastName[0] : '';
    return (first + last).toUpperCase() || 'EM';
  });

  readonly menuItems = computed<NavItem[]>(() => {
    const items: NavItem[] = [
      { label: 'Dashboard',  icon: 'pi pi-objects-column', route: '/' },
      { label: 'Sales / POS', icon: 'pi pi-shopping-cart',  route: '/sales' },
      { label: 'Catalog',    icon: 'pi pi-box',            route: '/catalog' },
      { label: 'Inventory',  icon: 'pi pi-warehouse',      route: '/inventory' },
    ];

    if (this.authService.currentRoles().includes('Admin')) {
      items.push({ label: 'Employees', icon: 'pi pi-users', route: '/employees' });
    }

    items.push(
      { label: 'Reports',    icon: 'pi pi-chart-line',     route: '/reports' },
      { label: 'Settings',   icon: 'pi pi-cog',            route: '/settings' }
    );

    return items;
  });
}
