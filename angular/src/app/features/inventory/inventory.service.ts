import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DbService, LocalProduct } from '../../core/db.service';
import { Observable, from, of, firstValueFrom } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private readonly apiUrl = 'http://localhost:5031/api/inventory';
  readonly isOnline = signal(navigator.onLine);

  constructor(
    private http: HttpClient,
    private db: DbService,
  ) {
    window.addEventListener('online', () => this.onOnlineStatusChange(true));
    window.addEventListener('offline', () => this.onOnlineStatusChange(false));

    // Initial sync check on startup
    if (this.isOnline()) {
      this.syncPendingProducts().subscribe();
    }
  }

  private onOnlineStatusChange(online: boolean) {
    this.isOnline.set(online);
    if (online) {
      this.syncPendingProducts().subscribe();
    }
  }

  getProducts(
    search?: string,
    categories?: string[],
    page = 1,
    pageSize = 10,
    sortBy?: string,
    sortDescending = false,
  ): Observable<PaginatedResult<LocalProduct>> {
    if (!this.isOnline()) {
      // Offline: query Dexie database directly
      return from(this.db.products.toArray()).pipe(
        map((products) => {
          let filtered = [...products];

          // Search filtering (SKU or Name)
          if (search) {
            const s = search.toLowerCase();
            filtered = filtered.filter(
              (p) => p.sku.toLowerCase().includes(s) || p.name.toLowerCase().includes(s),
            );
          }

          // Category filtering
          if (categories && categories.length > 0) {
            const catsLower = categories.map((c) => c.toLowerCase());
            filtered = filtered.filter((p) => catsLower.includes(p.category.toLowerCase()));
          }

          // Sorting
          if (sortBy) {
            const field = sortBy as keyof LocalProduct;
            filtered.sort((a, b) => {
              let valA = a[field] ?? '';
              let valB = b[field] ?? '';

              if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = (valB as string).toLowerCase();
              }

              if (valA < valB) return sortDescending ? 1 : -1;
              if (valA > valB) return sortDescending ? -1 : 1;
              return 0;
            });
          } else {
            // Default sort by Name
            filtered.sort((a, b) => a.name.localeCompare(b.name));
          }

          const totalCount = filtered.length;
          const startIndex = (page - 1) * pageSize;
          const items = filtered.slice(startIndex, startIndex + pageSize);

          return {
            items,
            totalCount,
            page,
            pageSize,
            totalPages: Math.ceil(totalCount / pageSize),
          };
        }),
      );
    }

    // Online: Fetch from API and sync to local DB cache
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('sortDescending', sortDescending.toString());

    if (search) params = params.set('search', search);
    if (categories && categories.length > 0) {
      categories.forEach((cat) => {
        params = params.append('category', cat);
      });
    }
    if (sortBy) params = params.set('sortBy', sortBy);

    return this.http.get<PaginatedResult<LocalProduct>>(this.apiUrl, { params }).pipe(
      tap((result) => {
        // Cache API items locally in Dexie
        from(
          this.db.products.bulkPut(
            result.items.map((item) => ({ ...item, syncStatus: 'synced' }) as LocalProduct),
          ),
        ).subscribe();
      }),
      catchError(() => {
        // Fallback to offline querying if API fails unexpectedly
        return this.getProductsOffline(search, categories, page, pageSize, sortBy, sortDescending);
      }),
    );
  }

  private getProductsOffline(
    search?: string,
    categories?: string[],
    page = 1,
    pageSize = 10,
    sortBy?: string,
    sortDescending = false,
  ): Observable<PaginatedResult<LocalProduct>> {
    return from(this.db.products.toArray()).pipe(
      map((products) => {
        let filtered = [...products];

        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter(
            (p) => p.sku.toLowerCase().includes(s) || p.name.toLowerCase().includes(s),
          );
        }

        if (categories && categories.length > 0) {
          const catsLower = categories.map((c) => c.toLowerCase());
          filtered = filtered.filter((p) => catsLower.includes(p.category.toLowerCase()));
        }

        if (sortBy) {
          const field = sortBy as keyof LocalProduct;
          filtered.sort((a, b) => {
            let valA = a[field] ?? '';
            let valB = b[field] ?? '';

            if (typeof valA === 'string') {
              valA = valA.toLowerCase();
              valB = (valB as string).toLowerCase();
            }

            if (valA < valB) return sortDescending ? 1 : -1;
            if (valA > valB) return sortDescending ? -1 : 1;
            return 0;
          });
        }

        const totalCount = filtered.length;
        const startIndex = (page - 1) * pageSize;
        const items = filtered.slice(startIndex, startIndex + pageSize);

        return {
          items,
          totalCount,
          page,
          pageSize,
          totalPages: Math.ceil(totalCount / pageSize),
        };
      }),
    );
  }

  createProduct(
    product: Omit<LocalProduct, 'syncStatus' | 'createdAt' | 'updatedAt' | 'isNewOffline'>,
  ): Observable<LocalProduct> {
    const fullProduct: LocalProduct = {
      ...product,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending',
      isNewOffline: true,
    };

    return from(this.db.products.add(fullProduct)).pipe(
      switchMap(() => {
        if (!this.isOnline()) {
          return of(fullProduct);
        }

        return this.http.post(this.apiUrl, fullProduct).pipe(
          switchMap(() => {
            const syncedProduct: LocalProduct = {
              ...fullProduct,
              syncStatus: 'synced',
              isNewOffline: false,
            };
            return from(this.db.products.put(syncedProduct)).pipe(map(() => syncedProduct));
          }),
          catchError(() => {
            return of(fullProduct);
          }),
        );
      }),
    );
  }

  updateProduct(product: LocalProduct): Observable<LocalProduct> {
    const updatedProduct: LocalProduct = {
      ...product,
      updatedAt: new Date().toISOString(),
      syncStatus: product.syncStatus === 'synced' ? 'pending' : product.syncStatus,
    };

    return from(this.db.products.put(updatedProduct)).pipe(
      switchMap(() => {
        if (!this.isOnline()) {
          return of(updatedProduct);
        }

        const updateObs = updatedProduct.isNewOffline
          ? this.http.post(this.apiUrl, updatedProduct)
          : this.http.put(`${this.apiUrl}/${updatedProduct.id}`, updatedProduct);

        return updateObs.pipe(
          switchMap(() => {
            const syncedProduct: LocalProduct = {
              ...updatedProduct,
              syncStatus: 'synced',
              isNewOffline: false,
            };
            return from(this.db.products.put(syncedProduct)).pipe(map(() => syncedProduct));
          }),
          catchError(() => {
            return of(updatedProduct);
          }),
        );
      }),
    );
  }

  deleteProduct(id: string): Observable<void> {
    return from(this.db.products.get(id)).pipe(
      switchMap((existingProduct) => {
        if (!existingProduct) {
          return of(void 0);
        }

        return from(this.db.products.delete(id)).pipe(
          switchMap(() => {
            if (existingProduct.isNewOffline) {
              // Local-only product: don't need server deletion
              return of(void 0);
            }

            // Sync deletion to server or queue it
            return from(this.db.pendingDeletions.put({ id })).pipe(
              switchMap(() => {
                if (!this.isOnline()) {
                  return of(void 0);
                }

                return this.http.delete(`${this.apiUrl}/${id}`).pipe(
                  switchMap(() => {
                    return from(this.db.pendingDeletions.delete(id));
                  }),
                  catchError(() => {
                    return of(void 0);
                  }),
                );
              }),
            );
          }),
        );
      }),
    );
  }

  syncPendingProducts(): Observable<void> {
    // 1. Process pending additions & updates
    const syncCreationsAndUpdates$ = from(
      this.db.products.where('syncStatus').equals('pending').toArray(),
    ).pipe(
      switchMap((pendingProducts) => {
        if (pendingProducts.length === 0) {
          return of(void 0);
        }

        const syncPromises = pendingProducts.map((p) => {
          const apiCall$ = p.isNewOffline
            ? this.http.post(this.apiUrl, p)
            : this.http.put(`${this.apiUrl}/${p.id}`, p);

          return firstValueFrom(
            apiCall$.pipe(
              switchMap(() => {
                return from(
                  this.db.products.update(p.id, { syncStatus: 'synced', isNewOffline: false }),
                );
              }),
              catchError((error) => {
                console.error(`Failed to sync product ${p.sku}`, error);
                if (error.status === 400) {
                  return from(this.db.products.update(p.id, { syncStatus: 'failed' }));
                }
                return of(null);
              }),
            ),
          );
        });

        return from(Promise.all(syncPromises)).pipe(map(() => void 0));
      }),
    );

    // 2. Process pending deletions
    const syncDeletions$ = from(this.db.pendingDeletions.toArray()).pipe(
      switchMap((pendingDeletions) => {
        if (pendingDeletions.length === 0) {
          return of(void 0);
        }

        const deletePromises = pendingDeletions.map((d) => {
          return firstValueFrom(
            this.http.delete(`${this.apiUrl}/${d.id}`).pipe(
              switchMap(() => {
                return from(this.db.pendingDeletions.delete(d.id));
              }),
              catchError((error) => {
                console.error(`Failed to sync deletion for ID ${d.id}`, error);
                // If it is 404 (already deleted on server), we can clean it from pendingDeletions
                if (error.status === 404) {
                  return from(this.db.pendingDeletions.delete(d.id));
                }
                return of(null);
              }),
            ),
          );
        });

        return from(Promise.all(deletePromises)).pipe(map(() => void 0));
      }),
    );

    return syncCreationsAndUpdates$.pipe(switchMap(() => syncDeletions$));
  }
}
