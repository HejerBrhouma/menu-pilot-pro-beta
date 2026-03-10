// src/app/pages/dashboard/category/category.component.ts

import { Component } from '@angular/core';
import { CategoryListComponent } from './category-list/category-list.component';

@Component({
  selector: 'app-categories-page',
  standalone: true,
  imports: [CategoryListComponent],
  template: `<app-category-list></app-category-list>`
})
export class CategoryComponent {}
















