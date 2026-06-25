import { Component, input, model, output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoreModule } from '../../../core/core.module';
import { Table } from 'primeng/table';
import { LocalProduct } from '../../../core/db.service';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CoreModule],
  templateUrl: './inventory-list.component.html',
})
export class InventoryListComponent {
  @ViewChild('dt') dt!: Table;

  // Inputs
  readonly products = input.required<LocalProduct[]>();
  readonly totalCount = input.required<number>();
  readonly loading = input.required<boolean>();
  readonly categories = input.required<string[]>();
  readonly pendingSyncCount = input.required<number>();

  // Two-way Model Inputs (Angular 18+)
  readonly selectedProducts = model<LocalProduct[]>([]);
  readonly selectedCategories = model<string[]>([]);
  readonly searchQuery = model<string>('');
  readonly pageSize = model<number>(10);
  readonly page = model<number>(1);

  // Outputs (events)
  readonly addProduct = output<void>();
  readonly editProduct = output<LocalProduct>();
  readonly deleteProduct = output<LocalProduct>();
  readonly deleteSelectedProducts = output<void>();
  readonly sync = output<void>();
  readonly lazyLoad = output<any>();
  readonly filterChange = output<void>();

  onSearchChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
    this.page.set(1);
    this.filterChange.emit();
  }

  onCategoryChange(): void {
    this.page.set(1);
    this.filterChange.emit();
  }

  onTableLazyLoad(event: any): void {
    this.lazyLoad.emit(event);
  }

  exportCSV(): void {
    if (this.dt) {
      this.dt.exportCSV();
    }
  }
}
