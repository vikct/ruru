import { Component, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';

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

  readonly navItems: NavItem[] = [
    { label: 'Dashboard',  icon: 'pi pi-objects-column', route: '/' },
    { label: 'Sales / POS', icon: 'pi pi-shopping-cart',  route: '/sales' },
    { label: 'Catalog',    icon: 'pi pi-box',            route: '/catalog' },
    { label: 'Inventory',  icon: 'pi pi-warehouse',      route: '/inventory' },
    { label: 'Reports',    icon: 'pi pi-chart-line',     route: '/reports' },
    { label: 'Settings',   icon: 'pi pi-cog',            route: '/settings' },
  ];
}
