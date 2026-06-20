import { Component, OnInit, signal, effect, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { CoreModule } from '../../core/core.module';
import { InventoryService } from './inventory.service';
import { LocalProduct } from '../../core/db.service';
import { MessageService } from 'primeng/api';
import { Table } from 'primeng/table';
import { forkJoin } from 'rxjs';
import { MetricCardComponent } from './components/metric-card.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CoreModule, MetricCardComponent, RouterLink],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  // Data Signals
  readonly products = signal<LocalProduct[]>([]);
  readonly totalCount = signal<number>(0);
  readonly loading = signal<boolean>(false);

  // Selection & Editing State
  selectedProducts: LocalProduct[] = [];
  readonly editingProduct = signal<LocalProduct | null>(null);

  // Stats Signals (computed from loaded products)
  readonly stats = computed(() => {
    const list = this.products();
    const totalSKUs = this.totalCount();

    // Note: since we only have the current page's products loaded in the signal,
    // we'll calculate local totals. For accurate global stats in a real app
    // we'd query the DB, but since we retrieve lists we can compute it.
    let totalVal = 0;
    let lowStockCount = 0;
    let pendingSyncCount = 0;

    list.forEach((p) => {
      totalVal += p.quantityInStock * p.costPrice;
      if (p.quantityInStock <= p.reorderLevel) {
        lowStockCount++;
      }
      if (p.syncStatus === 'pending') {
        pendingSyncCount++;
      }
    });

    return {
      totalSKUs,
      totalValue: totalVal,
      lowStockCount,
      pendingSyncCount,
    };
  });

  // Filter Signals
  readonly categories = signal<string[]>(['Coffee', 'Bakery', 'Merchandise', 'Beverages', 'Other']);
  readonly selectedCategory = signal<string | null>(null);
  readonly searchQuery = signal<string>('');

  readonly dropdownCategories = computed(() => {
    const list = this.categories().map((cat) => ({ label: cat, value: cat }));
    list.push({ label: '+ Add Custom Category...', value: 'CUSTOM' });
    return list;
  });

  // Pagination & Sort Signals
  readonly page = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly sortBy = signal<string>('name');
  readonly sortDescending = signal<boolean>(false);

  // UI Control Signals
  readonly displayAddDialog = signal<boolean>(false);
  readonly isCustomCategory = signal<boolean>(false);

  // Form
  productForm!: FormGroup;

  // Online connection status
  isOnline = signal(navigator.onLine);

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private messageService: MessageService,
  ) {
    this.isOnline = this.inventoryService.isOnline;

    // Reload items if online status transitions
    effect(() => {
      if (this.isOnline()) {
        this.loadProducts();
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadProducts();
  }

  initForm(): void {
    this.productForm = this.fb.group({
      sku: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.maxLength(150)]],
      description: [''],
      category: ['Coffee', Validators.required],
      customCategory: [''],
      quantityInStock: [0, [Validators.required, Validators.min(0)]],
      reorderLevel: [5, [Validators.required, Validators.min(0)]],
      costPrice: [0.0, [Validators.required, Validators.min(0)]],
      sellingPrice: [0.0, [Validators.required, Validators.min(0)]],
      supplier: [''],
    });

    // Toggle custom category input when "Other" is selected or when a custom option is needed
    this.productForm.get('category')?.valueChanges.subscribe((val) => {
      if (val === 'CUSTOM') {
        this.isCustomCategory.set(true);
        this.productForm.get('customCategory')?.setValidators([Validators.required]);
      } else {
        this.isCustomCategory.set(false);
        this.productForm.get('customCategory')?.clearValidators();
      }
      this.productForm.get('customCategory')?.updateValueAndValidity();
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    this.inventoryService
      .getProducts(
        this.searchQuery(),
        this.selectedCategory() || undefined,
        this.page(),
        this.pageSize(),
        this.sortBy(),
        this.sortDescending(),
      )
      .subscribe({
        next: (result) => {
          this.products.set(result.items);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);

          // Dynamically add unique categories from db products to local filters
          this.updateCategoriesList(result.items);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Fetch Failed',
            detail: 'Unable to load products. Switched to offline view.',
          });
          this.loading.set(false);
        },
      });
  }

  updateCategoriesList(items: LocalProduct[]): void {
    const currentCats = new Set(this.categories());
    items.forEach((item) => {
      if (item.category && !currentCats.has(item.category)) {
        this.categories.update((cats) => [...cats, item.category]);
      }
    });
  }

  onSearchChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
    this.page.set(1);
    this.loadProducts();
  }

  selectCategory(category: string | null): void {
    this.selectedCategory.set(category);
    this.page.set(1);
    this.loadProducts();
  }

  onLazyLoad(event: any): void {
    const newPage = Math.floor((event.first ?? 0) / (event.rows ?? 10)) + 1;
    this.page.set(newPage);
    this.pageSize.set(event.rows ?? 10);

    if (event.sortField) {
      this.sortBy.set(event.sortField);
      this.sortDescending.set(event.sortOrder === -1);
    }

    this.loadProducts();
  }

  openAddDialog(): void {
    this.editingProduct.set(null);
    this.productForm.reset({
      category: 'Coffee',
      quantityInStock: 0,
      reorderLevel: 5,
      costPrice: 0.0,
      sellingPrice: 0.0,
    });
    this.isCustomCategory.set(false);
    this.displayAddDialog.set(true);
  }

  closeAddDialog(): void {
    this.displayAddDialog.set(false);
    this.editingProduct.set(null);
  }

  editProduct(product: LocalProduct): void {
    this.editingProduct.set(product);

    // Check if product's category exists in standard list
    const hasPresetCategory = this.categories().includes(product.category);

    this.productForm.reset({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      category: hasPresetCategory ? product.category : 'CUSTOM',
      customCategory: hasPresetCategory ? '' : product.category,
      quantityInStock: product.quantityInStock,
      reorderLevel: product.reorderLevel,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      supplier: product.supplier || '',
    });

    this.isCustomCategory.set(!hasPresetCategory);
    this.displayAddDialog.set(true);
  }

  deleteProduct(product: LocalProduct): void {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      this.loading.set(true);
      this.inventoryService.deleteProduct(product.id).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Product Deleted',
            detail: `"${product.name}" has been deleted successfully.`,
          });
          // Remove from selection if it was selected
          this.selectedProducts = this.selectedProducts.filter((p) => p.id !== product.id);
          this.loadProducts();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Delete Failed',
            detail: 'Unable to delete product.',
          });
          this.loading.set(false);
        },
      });
    }
  }

  deleteSelectedProducts(): void {
    if (!this.selectedProducts || this.selectedProducts.length === 0) return;

    const count = this.selectedProducts.length;
    if (confirm(`Are you sure you want to delete the selected ${count} product(s)?`)) {
      this.loading.set(true);

      const deletions$ = this.selectedProducts.map((p) =>
        this.inventoryService.deleteProduct(p.id),
      );

      forkJoin(deletions$).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Deletions Successful',
            detail: `Selected ${count} product(s) deleted.`,
          });
          this.selectedProducts = [];
          this.loadProducts();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Bulk Delete Failed',
            detail: 'Failed to delete some or all selected products.',
          });
          this.selectedProducts = [];
          this.loadProducts();
        },
      });
    }
  }

  exportCSV(): void {
    if (this.dt) {
      this.dt.exportCSV();
    }
  }

  submitProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const formValues = this.productForm.value;

    // Resolve category name (standard preset or custom entered text)
    let categoryName = formValues.category;
    if (categoryName === 'CUSTOM') {
      categoryName = formValues.customCategory.trim();
    }

    const isEdit = !!this.editingProduct();
    this.loading.set(true);

    if (isEdit) {
      const updatedProduct: LocalProduct = {
        ...this.editingProduct()!,
        sku: formValues.sku.trim().toUpperCase(),
        name: formValues.name.trim(),
        description: formValues.description ? formValues.description.trim() : '',
        category: categoryName,
        quantityInStock: formValues.quantityInStock,
        reorderLevel: formValues.reorderLevel,
        costPrice: formValues.costPrice,
        sellingPrice: formValues.sellingPrice,
        supplier: formValues.supplier ? formValues.supplier.trim() : '',
      };

      this.inventoryService.updateProduct(updatedProduct).subscribe({
        next: (product) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Product Updated',
            detail: `"${product.name}" has been updated successfully. ${
              product.syncStatus === 'pending' ? '(Offline Queue)' : '(Synced)'
            }`,
          });

          // Add custom category to local filters list if it doesn't exist
          if (!this.categories().includes(product.category)) {
            this.categories.update((cats) => [...cats, product.category]);
          }

          this.displayAddDialog.set(false);
          this.editingProduct.set(null);
          this.loadProducts();
        },
        error: (err) => {
          const errorDetail = err.error?.errors?.Sku?.[0] || 'Failed to update product.';
          this.messageService.add({
            severity: 'error',
            summary: 'Save Error',
            detail: errorDetail,
          });
          this.loading.set(false);
        },
      });
    } else {
      // Prepare payload for creation
      const newProduct = {
        id: this.generateUUID(),
        sku: formValues.sku.trim().toUpperCase(),
        name: formValues.name.trim(),
        description: formValues.description ? formValues.description.trim() : '',
        category: categoryName,
        quantityInStock: formValues.quantityInStock,
        reorderLevel: formValues.reorderLevel,
        costPrice: formValues.costPrice,
        sellingPrice: formValues.sellingPrice,
        supplier: formValues.supplier ? formValues.supplier.trim() : '',
      };

      this.inventoryService.createProduct(newProduct).subscribe({
        next: (product) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Product Created',
            detail: `"${product.name}" has been added successfully. ${
              product.syncStatus === 'pending' ? '(Offline Queue)' : '(Synced)'
            }`,
          });

          // Add custom category to local filters list if it doesn't exist
          if (!this.categories().includes(product.category)) {
            this.categories.update((cats) => [...cats, product.category]);
          }

          this.displayAddDialog.set(false);
          this.loadProducts();
        },
        error: (err) => {
          const errorDetail = err.error?.errors?.Sku?.[0] || 'Failed to create product.';
          this.messageService.add({
            severity: 'error',
            summary: 'Save Error',
            detail: errorDetail,
          });
          this.loading.set(false);
        },
      });
    }
  }

  triggerSync(): void {
    this.loading.set(true);
    this.inventoryService.syncPendingProducts().subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sync Complete',
          detail: 'Offline changes uploaded to the cloud database.',
        });
        this.loadProducts();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Sync Failed',
          detail: 'Could not connect to server. Please try again later.',
        });
        this.loading.set(false);
      },
    });
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
