import { Category } from './category.model';

export interface Product {
  '@id'?: string;
  id?: number;
  name: string;
  price: number;
  description?: string;
  isAvailable?: boolean;
  categories: Category[];
}

export interface Pack {
  '@id'?: string;
  id?: number;
  name: string;
  description?: string;
  price: number;
  isActive: boolean;
  trackStock?: boolean;
  stock?: number | null;
  products: string[]; // IRIs pour écriture
}

export interface PackRead extends Omit<Pack, 'products'> {
  products: Product[]; // objets complets en lecture
}
