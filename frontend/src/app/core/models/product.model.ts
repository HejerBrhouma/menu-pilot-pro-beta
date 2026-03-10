// src/app/core/models/product.model.ts

export interface Category {
  '@id': string;
  id: number;
  name: string;
}

export interface Product {
  '@id'?: string;
  id?: number;
  name: string;
  price: number;
  description?: string;
  isAvailable?: boolean;
  categories: string[]; // IRIs ex: ["/api/categories/1"]
}

export interface ProductRead extends Omit<Product, 'categories'> {
  categories: Category[];
}
















