import { Component, model, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TuiIcon, TuiHint } from '@taiga-ui/core';
import { TuiAvatar } from '@taiga-ui/kit';
import { AuthService } from '../../services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TuiIcon, TuiHint, TuiAvatar],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  host: {
    '[class.open]': 'isMobileOpen()',
  },
})
export class AppSidebarComponent {
  readonly collapsed = model.required<boolean>();
  readonly isMobileOpen = model.required<boolean>();

  readonly showTooltip = computed(() => this.collapsed() && !this.isMobileOpen());

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
      { label: 'Dashboard', icon: '@tui.layout-grid', route: '/' },
      { label: 'Sales / POS', icon: '@tui.shopping-cart', route: '/sales' },
      { label: 'Catalog', icon: '@tui.box', route: '/catalog' },
      { label: 'Inventory', icon: '@tui.clipboard-list', route: '/inventory' },
    ];

    if (this.authService.currentRoles().includes('Admin')) {
      items.push({ label: 'Employees', icon: '@tui.users', route: '/employees' });
    }

    items.push(
      { label: 'Reports', icon: '@tui.bar-chart-2', route: '/reports' },
      { label: 'Settings', icon: '@tui.settings', route: '/settings' },
    );

    return items;
  });
}
