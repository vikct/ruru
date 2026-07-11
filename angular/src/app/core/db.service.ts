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

export interface LocalEmployee {
  id: string;
  storeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  totpSecret: string;
  isTotpSetUp: boolean;
  isActive: boolean;
  profilePhotoUrl?: string;
}

export interface LocalRole {
  id: number;
  name: string;
  description: string;
}

export interface LocalVoucher {
  id: string;
  code: string;
  type: 'FixedAmount' | 'Percentage';
  value: number;
  minOrderSubtotal: number;
  expiresAt?: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DbService extends Dexie {
  products!: Table<LocalProduct, string>;
  pendingDeletions!: Table<PendingDeletion, string>;
  employees!: Table<LocalEmployee, string>;
  roles!: Table<LocalRole, number>;
  vouchers!: Table<LocalVoucher, string>;

  constructor() {
    super('RuruPOSDb');
    this.version(3).stores({
      products: 'id, sku, name, category, syncStatus',
      pendingDeletions: 'id',
      employees: 'id, employeeCode, email, isActive',
      roles: 'id, name',
      vouchers: 'id, code, isActive'
    });
  }
}
