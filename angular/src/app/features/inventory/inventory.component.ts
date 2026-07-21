import { Component, OnInit, signal, effect, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CoreModule } from '../../core/core.module';
import { InventoryService } from './inventory.service';
import { LocalProduct } from '../../core/db.service';
import { TuiNotificationService, TuiIcon } from '@taiga-ui/core';
import { Dialog } from '@angular/cdk/dialog';
import { forkJoin } from 'rxjs';
import { MetricCardComponent } from './components/metric-card.component';
import { InventoryListComponent } from './inventory-list/inventory-list.component';
import { ProductFormComponent } from './product-form/product-form.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    CoreModule,
    MetricCardComponent,
    RouterLink,
    InventoryListComponent,
    TuiIcon
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly alerts = inject(TuiNotificationService);
  private readonly dialog = inject(Dialog);

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

  constructor() {
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
        error: () => {
          this.alerts.open('Unable to load products. Switched to offline view.', {
            label: 'Fetch Failed',
            appearance: 'error'
          }).subscribe();
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
    const ref = this.dialog.open<any>(ProductFormComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: {
        product: null,
        categories: this.categories()
      }
    });
    ref.closed.subscribe(result => {
      if (result) {
        this.onSaveProduct(result);
      }
    });
  }

  editProduct(product: LocalProduct): void {
    this.editingProduct.set(product);
    const ref = this.dialog.open<any>(ProductFormComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: {
        product,
        categories: this.categories()
      }
    });
    ref.closed.subscribe(result => {
      if (result) {
        this.onSaveProduct(result);
      } else {
        this.editingProduct.set(null);
      }
    });
  }

  deleteProduct(product: LocalProduct): void {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      this.loading.set(true);
      this.inventoryService.deleteProduct(product.id).subscribe({
        next: () => {
          this.alerts.open(`"${product.name}" has been deleted successfully.`, {
            label: 'Product Deleted',
            appearance: 'success'
          }).subscribe();
          this.selectedProducts = this.selectedProducts.filter((p) => p.id !== product.id);
          this.loadProducts();
        },
        error: () => {
          this.alerts.open('Unable to delete product.', {
            label: 'Delete Failed',
            appearance: 'error'
          }).subscribe();
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
          this.alerts.open(`Selected ${count} product(s) deleted.`, {
            label: 'Deletions Successful',
            appearance: 'success'
          }).subscribe();
          this.selectedProducts = [];
          this.loadProducts();
        },
        error: () => {
          this.alerts.open('Failed to delete some or all selected products.', {
            label: 'Bulk Delete Failed',
            appearance: 'error'
          }).subscribe();
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
        this.alerts.open('Offline changes uploaded to the cloud database.', {
          label: 'Sync Complete',
          appearance: 'success'
        }).subscribe();
        this.loadProducts();
      },
      error: () => {
        this.alerts.open('Could not connect to server. Please try again later.', {
          label: 'Sync Failed',
          appearance: 'error'
        }).subscribe();
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
          this.alerts.open(`"${product.name}" has been updated successfully.`, {
            label: 'Product Updated',
            appearance: 'success'
          }).subscribe();
          if (!this.categories().includes(product.category)) {
            this.categories.update((cats) => [...cats, product.category]);
          }
          this.displayAddDialog.set(false);
          this.editingProduct.set(null);
          this.loadProducts();
        },
        error: () => {
          this.alerts.open('Failed to update product.', {
            label: 'Save Error',
            appearance: 'error'
          }).subscribe();
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
          this.alerts.open(`"${product.name}" has been added successfully.`, {
            label: 'Product Created',
            appearance: 'success'
          }).subscribe();
          if (!this.categories().includes(product.category)) {
            this.categories.update((cats) => [...cats, product.category]);
          }
          this.displayAddDialog.set(false);
          this.loadProducts();
        },
        error: () => {
          this.alerts.open('Failed to create product.', {
            label: 'Save Error',
            appearance: 'error'
          }).subscribe();
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
