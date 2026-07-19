import { Component, input, model, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiIcon, TuiLoader, TuiTextfield, TuiLabel } from '@taiga-ui/core';
import { LocalProduct } from '../../../core/db.service';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TuiButton,
    TuiIcon,
    TuiLoader,
    TuiTextfield,
    TuiLabel
  ],
  templateUrl: './inventory-list.component.html',
  styleUrl: './inventory-list.component.scss',
})
export class InventoryListComponent {
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
  readonly sortBy = model<string>('name');
  readonly sortDescending = model<boolean>(false);

  // Outputs (events)
  readonly addProduct = output<void>();
  readonly editProduct = output<LocalProduct>();
  readonly deleteProduct = output<LocalProduct>();
  readonly deleteSelectedProducts = output<void>();
  readonly sync = output<void>();
  readonly filterChange = output<void>();

  // Math Helper for template
  readonly Math = Math;

  // Pagination Computeds
  readonly totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.totalCount() / this.pageSize()));
  });

  readonly pagesArray = computed(() => {
    const total = this.totalPages();
    const arr = [];
    for (let i = 1; i <= total; i++) {
      arr.push(i);
    }
    return arr;
  });

  onSearchChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
    this.page.set(1);
    this.filterChange.emit();
  }

  toggleCategoryFilter(category: string): void {
    const current = this.selectedCategories();
    if (current.includes(category)) {
      this.selectedCategories.set(current.filter(c => c !== category));
    } else {
      this.selectedCategories.set([...current, category]);
    }
    this.page.set(1);
    this.filterChange.emit();
  }

  clearCategoryFilters(): void {
    this.selectedCategories.set([]);
    this.page.set(1);
    this.filterChange.emit();
  }

  setPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) {
      this.page.set(p);
      this.filterChange.emit();
    }
  }

  toggleSort(field: string): void {
    if (this.sortBy() === field) {
      this.sortDescending.update(val => !val);
    } else {
      this.sortBy.set(field);
      this.sortDescending.set(false);
    }
    this.filterChange.emit();
  }

  // Checkbox helpers
  isProductSelected(product: LocalProduct): boolean {
    return this.selectedProducts().some(p => p.id === product.id);
  }

  toggleAll(checked: boolean): void {
    if (checked) {
      this.selectedProducts.set([...this.products()]);
    } else {
      this.selectedProducts.set([]);
    }
  }

  toggleProduct(product: LocalProduct, checked: boolean): void {
    const current = this.selectedProducts();
    if (checked) {
      this.selectedProducts.set([...current, product]);
    } else {
      this.selectedProducts.set(current.filter(p => p.id !== product.id));
    }
  }

  isAllSelected(): boolean {
    const list = this.products();
    if (list.length === 0) return false;
    return list.every(p => this.isProductSelected(p));
  }

  exportCSV(): void {
    const list = this.products();
    if (!list || list.length === 0) return;
    const replacer = (key: any, value: any) => value === null ? '' : value;
    const header = Object.keys(list[0]);
    const csv = [
      header.join(','),
      ...list.map(row => header.map(fieldName => JSON.stringify((row as any)[fieldName], replacer)).join(','))
    ].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "inventory.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
