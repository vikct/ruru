import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class AppFooterComponent {
  get yearRange(): string {
    const startYear = 2026;
    const currentYear = new Date().getFullYear();
    return currentYear > startYear ? `${startYear}-${currentYear}` : `${startYear}`;
  }
}
