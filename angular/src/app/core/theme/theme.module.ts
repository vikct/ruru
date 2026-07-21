import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTaiga } from '@taiga-ui/core';

@NgModule({
  imports: [
    CommonModule
  ],
  providers: [
    provideAnimationsAsync(),
    provideTaiga()
  ],
  exports: []
})
export class ThemeModule {}
