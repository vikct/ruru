import { Component, model, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { TuiButton, TuiIcon, TuiHint, TuiTextfield, TuiInput, TuiDropdown } from '@taiga-ui/core';
import { TuiAvatar, TuiBadge } from '@taiga-ui/kit';
import { ThemeService } from '../../theme/theme.service';
import { AuthService } from '../../services/auth.service';

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
    TuiBadge,
    TuiDropdown
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class AppHeaderComponent {
  readonly collapsed = model.required<boolean>();
  readonly isMobileOpen = model.required<boolean>();

  readonly themeService = inject(ThemeService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;
  readonly open = signal(false);

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

  signOut(): void {
    this.open.set(false);
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  toggleMenu(): void {
    if (window.innerWidth >= 992) {
      this.collapsed.update(v => !v);
    } else {
      this.isMobileOpen.update(v => !v);
    }
  }
}
