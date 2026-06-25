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
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { MultiSelectModule } from 'primeng/multiselect';
import { IftaLabelModule } from 'primeng/iftalabel';
import { MessageService } from 'primeng/api';

@NgModule({
  imports: [
    CommonModule,
    ButtonModule,
    TooltipModule,
    BadgeModule,
    AvatarModule,
    RippleModule,
    TableModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    ToastModule,
    ToolbarModule,
    MultiSelectModule,
    IftaLabelModule
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
    }),
    MessageService
  ],
  exports: [
    ButtonModule,
    TooltipModule,
    BadgeModule,
    AvatarModule,
    RippleModule,
    TableModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    ToastModule,
    ToolbarModule,
    MultiSelectModule,
    IftaLabelModule
  ]
})
export class ThemeModule {}
