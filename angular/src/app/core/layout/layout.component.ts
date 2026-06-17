import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive, TooltipModule, BadgeModule, AvatarModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class AppLayoutComponent {
  readonly collapsed = signal(false);
  readonly isMobileOpen = signal(false);

  readonly sidebarWidth = computed(() => this.collapsed() ? '64px' : '240px');

  readonly navItems: NavItem[] = [
    { label: 'Dashboard',  icon: 'pi pi-objects-column', route: '/' },
    { label: 'Sales / POS', icon: 'pi pi-shopping-cart',  route: '/sales' },
    { label: 'Catalog',    icon: 'pi pi-box',            route: '/catalog' },
    { label: 'Inventory',  icon: 'pi pi-warehouse',      route: '/inventory' },
    { label: 'Reports',    icon: 'pi pi-chart-line',     route: '/reports' },
    { label: 'Settings',   icon: 'pi pi-cog',            route: '/settings' },
  ];

  toggle(): void {
    this.collapsed.update(v => !v);
  }

  toggleMobile(): void {
    this.isMobileOpen.update(v => !v);
  }
}
