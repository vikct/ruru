import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiIcon } from '@taiga-ui/core';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule, TuiIcon],
  template: `
    <div class="card mb-0">
      <div class="flex justify-between mb-4">
        <div>
          <span class="block text-slate-500 dark:text-slate-400 font-medium mb-2 uppercase tracking-wider text-xs">
            {{ title() }}
          </span>
          <div class="text-slate-900 dark:text-slate-100 font-bold text-2xl">
            {{ value() }}
          </div>
        </div>
        <div class="flex items-center justify-center rounded-lg" [class]="iconBgClass()" style="width: 2.5rem; height: 2.5rem">
          <tui-icon [icon]="icon()" class="text-xl" [class]="iconColorClass()"></tui-icon>
        </div>
      </div>
      @if (footerValue()) {
        <span class="font-semibold" [class]="footerColorClass()">{{ footerValue() }} </span>
      }
      <span class="text-slate-500 dark:text-slate-400 text-sm">
        {{ footerText() }}
      </span>
    </div>
  `
})
export class MetricCardComponent {
  readonly title = input.required<string>();
  readonly value = input.required<string | number>();
  readonly icon = input.required<string>();
  readonly iconBgClass = input<string>('bg-slate-100 dark:bg-slate-800');
  readonly iconColorClass = input<string>('text-slate-500 dark:text-slate-400');
  readonly footerValue = input<string | number>('');
  readonly footerText = input<string>('');
  readonly footerColorClass = input<string>('text-slate-500 dark:text-slate-400');
}
