import { Component, signal, computed } from '@angular/core';
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
  readonly collapsed = signal(false);
  readonly isMobileOpen = signal(false);

  readonly containerClass = computed(() => ({
    'layout-static-inactive': this.collapsed(),
    'layout-mobile-active': this.isMobileOpen()
  }));
}
