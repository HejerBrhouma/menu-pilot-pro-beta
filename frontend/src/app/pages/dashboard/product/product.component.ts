import { Component } from '@angular/core';
import { ProductListComponent } from './product-list/product-list.component';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [ProductListComponent],
  template: `<app-product-list></app-product-list>`
})
export class ProductComponent {}
