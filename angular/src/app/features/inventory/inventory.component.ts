import { Component, OnInit, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CoreModule } from '../../core/core.module';
import { InventoryService } from './inventory.service';
import { LocalProduct } from '../../core/db.service';
import { MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { MetricCardComponent } from './components/metric-card.component';
import { InventoryListComponent } from './inventory-list/inventory-list.component';
import { ProductDialogComponent } from './components/product-dialog.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    CoreModule,
    MetricCardComponent,
    RouterLink,
    InventoryListComponent,
    ProductDialogComponent,
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent implements OnInit {
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
  readonly selectedCategories = signal<string[]>([]);
  readonly searchQuery = signal<string>('');

  // Pagination & Sort Signals
  readonly page = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly sortBy = signal<string>('name');
  readonly sortDescending = signal<boolean>(false);

  // UI Control Signals
  readonly displayAddDialog = signal<boolean>(false);

  // Online connection status
  isOnline = signal(navigator.onLine);

  constructor(
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
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.inventoryService
      .getProducts(
        this.searchQuery(),
        this.selectedCategories(),
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
    this.displayAddDialog.set(true);
  }

  closeAddDialog(): void {
    this.displayAddDialog.set(false);
    this.editingProduct.set(null);
  }

  editProduct(product: LocalProduct): void {
    this.editingProduct.set(product);
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

  onSaveProduct(formValues: any): void {
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
            detail: `"${product.name}" has been updated successfully.`,
          });
          if (!this.categories().includes(product.category)) {
            this.categories.update((cats) => [...cats, product.category]);
          }
          this.displayAddDialog.set(false);
          this.editingProduct.set(null);
          this.loadProducts();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Save Error',
            detail: 'Failed to update product.',
          });
          this.loading.set(false);
        },
      });
    } else {
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
            detail: `"${product.name}" has been added successfully.`,
          });
          if (!this.categories().includes(product.category)) {
            this.categories.update((cats) => [...cats, product.category]);
          }
          this.displayAddDialog.set(false);
          this.loadProducts();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Save Error',
            detail: 'Failed to create product.',
          });
          this.loading.set(false);
        },
      });
    }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
