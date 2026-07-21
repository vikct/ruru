import { Component, signal, computed, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppSidebarComponent } from './sidebar/sidebar.component';
import { AppHeaderComponent } from './header/header.component';
import { AppFooterComponent } from './footer/footer.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, AppSidebarComponent, AppHeaderComponent, AppFooterComponent],
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

  private isDesktop = window.innerWidth >= 992;

  @HostListener('window:resize')
  onResize() {
    const currentIsDesktop = window.innerWidth >= 992;
    if (currentIsDesktop !== this.isDesktop) {
      if (currentIsDesktop) {
        // Transitioning from Mobile to Desktop
        if (this.isMobileOpen()) {
          this.collapsed.set(false); // Open on mobile -> Expanded on desktop
        } else {
          this.collapsed.set(true);  // Closed on mobile -> Collapsed on desktop
        }
        this.isMobileOpen.set(false); // Clean up mobile drawer state
      } else {
        // Transitioning from Desktop to Mobile
        if (!this.collapsed()) {
          this.isMobileOpen.set(true);  // Expanded on desktop -> Open on mobile
        } else {
          this.isMobileOpen.set(false); // Collapsed on desktop -> Closed on mobile
        }
      }
      this.isDesktop = currentIsDesktop;
    }
  }
}
