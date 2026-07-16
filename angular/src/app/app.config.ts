import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Dialog } from '@angular/cdk/dialog';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { CoreModule } from './core/core.module';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

const RuruPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eef0fe',
      100: '#dde2fd',
      200: '#bbc5fb',
      300: '#98a8f9',
      400: '#768bf7',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#3f37c4',
      800: '#2f2996',
      900: '#1f1a68',
      950: '#13104a'
    }
  }
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    providePrimeNG({
      theme: {
        preset: RuruPreset,
        options: {
          darkModeSelector: '.ruru-dark'
        }
      },
      ripple: true
    }),
    Dialog,
    MessageService,
    importProvidersFrom(CoreModule)
  ]
};
