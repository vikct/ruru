import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';

export interface LocalProduct {
  id: string; // UUID v4
  sku: string;
  name: string;
  description: string;
  category: string;
  quantityInStock: number;
  reorderLevel: number;
  costPrice: number;
  sellingPrice: number;
  supplier: string;
  createdAt: string;
  updatedAt: string;
  syncStatus?: 'synced' | 'pending' | 'failed';
  isNewOffline?: boolean;
}

export interface PendingDeletion {
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class DbService extends Dexie {
  products!: Table<LocalProduct, string>;
  pendingDeletions!: Table<PendingDeletion, string>;

  constructor() {
    super('RuruPOSDb');
    this.version(2).stores({
      products: 'id, sku, name, category, syncStatus',
      pendingDeletions: 'id'
    });
  }
}
