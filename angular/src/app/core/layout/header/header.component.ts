import { Component, model, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TuiButton, TuiIcon, TuiHint, TuiTextfield, TuiInput } from '@taiga-ui/core';
import { TuiAvatar, TuiBadge } from '@taiga-ui/kit';
import { ThemeService } from '../../theme/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TuiButton,
    TuiIcon,
    TuiHint,
    TuiTextfield,
    TuiInput,
    TuiAvatar,
    TuiBadge
  ],
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
