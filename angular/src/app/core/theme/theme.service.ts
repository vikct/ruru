import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Default theme is dark mode (ruru-dark)
  readonly isDarkMode = signal<boolean>(
    localStorage.getItem('ruru-theme') !== 'light'
  );

  constructor() {
    effect(() => {
      const dark = this.isDarkMode();
      localStorage.setItem('ruru-theme', dark ? 'dark' : 'light');
      if (dark) {
        document.documentElement.classList.add('ruru-dark');
      } else {
        document.documentElement.classList.remove('ruru-dark');
      }
    });
  }

  toggleTheme(): void {
    this.isDarkMode.update(v => !v);
  }
}
