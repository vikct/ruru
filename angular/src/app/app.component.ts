import { Component, inject } from '@angular/core';
import { CoreModule } from './core/core.module';
import { CoreService } from './core/core.service';
import { ThemeService } from './core/theme/theme.service';

@Component({
  selector: 'app-root',
  imports: [CoreModule],
  template: `
    <tui-root [attr.tuiTheme]="themeService.isDarkMode() ? 'dark' : null">
      <app-layout>
        <router-outlet />
      </app-layout>
    </tui-root>
  `,
})
export class AppComponent {
  title = 'ruru';
  readonly themeService = inject(ThemeService);
  private core = inject(CoreService);
}
