import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TuiRoot } from '@taiga-ui/core';
import { ThemeModule } from './theme/theme.module';
import { AppLayoutComponent } from './layout/layout.component';

@NgModule({
  imports: [
    CommonModule,
    RouterOutlet,
    ThemeModule,
    AppLayoutComponent,
    TuiRoot
  ],
  exports: [
    ThemeModule,
    AppLayoutComponent,
    RouterOutlet,
    TuiRoot
  ]
})
export class CoreModule {}
