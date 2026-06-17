import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ThemeModule } from './theme/theme.module';
import { AppLayoutComponent } from './layout/layout.component';

@NgModule({
  imports: [
    CommonModule,
    RouterOutlet,
    ThemeModule,
    AppLayoutComponent
  ],
  exports: [
    ThemeModule,
    AppLayoutComponent,
    RouterOutlet
  ]
})
export class CoreModule {}
