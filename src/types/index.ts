export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin';
  createdAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unitPrice: number;
  supplierId: string;
  supplier?: Supplier;
  description?: string;
  sku?: string;
  unit: string; // 'pieces', 'kg', 'liters', etc.
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  date: Date;
  totalValue: number;
}

export interface StockAlert {
  id: string;
  productId: string;
  product?: Product;
  alertType: 'low_stock' | 'out_of_stock';
  isActive: boolean;
  createdAt: Date;
}

export interface DayClosing {
  id: string;
  date: Date;
  sales: Sale[];
  totalSales: number;
  totalValue: number;
  closedBy: string;
  createdAt: Date;
}