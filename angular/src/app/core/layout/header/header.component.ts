import { Component, model, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { ThemeService } from '../../theme/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, TooltipModule, BadgeModule, AvatarModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class AppHeaderComponent {
  readonly collapsed = model.required<boolean>();
  readonly isMobileOpen = model.required<boolean>();

  readonly themeService = inject(ThemeService);

  toggleMenu(): void {
    if (window.innerWidth >= 992) {
      this.collapsed.update(v => !v);
    } else {
      this.isMobileOpen.update(v => !v);
    }
  }
}
