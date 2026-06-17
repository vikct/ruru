import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

// PrimeNG Modules used across the app
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { RippleModule } from 'primeng/ripple';

@NgModule({
  imports: [
    CommonModule,
    ButtonModule,
    TooltipModule,
    BadgeModule,
    AvatarModule,
    RippleModule
  ],
  providers: [
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.ruru-dark'
        }
      }
    })
  ],
  exports: [
    ButtonModule,
    TooltipModule,
    BadgeModule,
    AvatarModule,
    RippleModule
  ]
})
export class ThemeModule {}
