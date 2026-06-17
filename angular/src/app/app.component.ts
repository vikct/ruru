import { Component, inject } from '@angular/core';
import { CoreModule } from './core/core.module';
import { CoreService } from './core/core.service';

@Component({
  selector: 'app-root',
  imports: [CoreModule],
  template: `
    <app-layout>
      <router-outlet />
    </app-layout>
  `,
})
export class AppComponent {
  title = 'ruru';
  private core = inject(CoreService);
}
