import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppSidebarComponent } from './sidebar/sidebar.component';
import { AppHeaderComponent } from './header/header.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, AppSidebarComponent, AppHeaderComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class AppLayoutComponent {
  readonly collapsed = signal<boolean>(
    localStorage.getItem('ruru-sidebar-collapsed') === 'true'
  );
  readonly isMobileOpen = signal(false);

  readonly containerClass = computed(() => ({
    'layout-static-inactive': this.collapsed(),
    'layout-mobile-active': this.isMobileOpen()
  }));

  constructor() {
    effect(() => {
      localStorage.setItem('ruru-sidebar-collapsed', String(this.collapsed()));
    });
  }
}
