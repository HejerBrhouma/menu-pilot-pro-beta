// src/app/core/services/product.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Product, ProductRead } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly url = '/api/products';

  constructor(private http: HttpClient) {}

  getAll(page = 1, perPage = 10): Observable<{ items: ProductRead[]; total: number }> {
    const params = new HttpParams()
      .set('page', page)
      .set('itemsPerPage', perPage);
    return this.http.get<any>(this.url, { params }).pipe(
      map(res => ({ items: res['hydra:member'], total: res['hydra:totalItems'] })),
      catchError(this.handleError)
    );
  }

  getOne(id: number): Observable<ProductRead> {
    return this.http.get<ProductRead>(`${this.url}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  create(product: Omit<Product, 'id' | '@id'>): Observable<ProductRead> {
    return this.http.post<ProductRead>(this.url, product).pipe(
      catchError(this.handleError)
    );
  }

  update(id: number, product: Partial<Product>): Observable<ProductRead> {
    return this.http.patch<ProductRead>(`${this.url}/${id}`, product, {
      headers: { 'Content-Type': 'application/merge-patch+json' }
    }).pipe(catchError(this.handleError));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    const msg = error?.error?.['hydra:description'] || error?.message || 'Erreur serveur';
    return throwError(() => new Error(msg));
  }
}
