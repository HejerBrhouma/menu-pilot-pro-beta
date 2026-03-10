// src/app/core/models/menu.model.ts

import { ProductRead } from './product.model';
import { PackRead } from './pack.model';
import { Category } from './category.model';

export interface MenuSection {
  '@id'?: string;
  id?: number;
  title: string;
  position: number;
  products: string[];   // IRIs en écriture
  packs: string[];
  categories: string[];
}

export interface MenuSectionRead extends Omit<MenuSection, 'products' | 'packs' | 'categories'> {
  products: ProductRead[];
  packs: PackRead[];
  categories: Category[];
}

export interface Menu {
  '@id'?: string;
  id?: number;
  name: string;
  description?: string;
  isActive: boolean;
  timeStart?: string; // "11:00"
  timeEnd?: string;   // "14:30"
  qrToken?: string;
  createdAt?: string;
  sections: MenuSection[];
}

export interface MenuRead extends Omit<Menu, 'sections'> {
  sections: MenuSectionRead[];
}
