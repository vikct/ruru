import { Component, inject } from '@angular/core';
import { CoreModule } from './core/core.module';
import { CoreService } from './core/core.service';
import { ThemeService } from './core/theme/theme.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [CoreModule],
  template: `
    <tui-root [attr.tuiTheme]="themeService.isDarkMode() ? 'dark' : null">
      @if (authService.currentUser()) {
        <app-layout>
          <router-outlet />
        </app-layout>
      } @else {
        <router-outlet />
      }
    </tui-root>
  `,
})
export class AppComponent {
  title = 'ruru';
  readonly themeService = inject(ThemeService);
  readonly authService = inject(AuthService);
  private core = inject(CoreService);
}
