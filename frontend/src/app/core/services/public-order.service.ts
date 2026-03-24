// src/app/core/services/public-order.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface PublicTableInfo {
  table: {
    id:       number;
    name:     string;
    capacity: number;
    qrToken:  string;
  };
  establishment: {
    id:          number;
    name:        string;
    slug:        string;
    logo:        string | null;
    description: string | null;
  };
}

export interface PublicCartItem {
  itemType:  'PRODUCT' | 'PACK';
  itemId:    number;
  itemName:  string;
  unitPrice: number;
  quantity:  number;
  notes:     string;
}

export interface PublicOrderResult {
  orderId:     number;
  orderNumber: string;
  total:       number;
  status:      string;
}

export interface PublicOrderStatus {
  orderId:     number;
  orderNumber: string;
  status:      string;
  total:       number;
  updatedAt:   string;
}

@Injectable({ providedIn: 'root' })
export class PublicOrderService {
  private http = inject(HttpClient);

  getTableInfo(token: string): Observable<PublicTableInfo> {
    return this.http.get<PublicTableInfo>(`/api/public/table/${token}`)
      .pipe(catchError(this.handleError));
  }

  getProducts(establishmentSlug: string): Observable<any> {
    return this.http.get<any>(`/api/products?isAvailable=true`)
      .pipe(catchError(this.handleError));
  }

  getPacks(): Observable<any> {
    return this.http.get<any>(`/api/packs?isActive=true`)
      .pipe(catchError(this.handleError));
  }

  getCategories(): Observable<any> {
    return this.http.get<any>(`/api/categories`)
      .pipe(catchError(this.handleError));
  }

  createOrder(
    tableToken: string,
    items: PublicCartItem[],
    notes?: string,
    customerName?: string
  ): Observable<PublicOrderResult> {
    return this.http.post<PublicOrderResult>('/api/public/orders', {
      tableToken,
      items,
      notes:        notes || null,
      customerName: customerName || null
    }).pipe(catchError(this.handleError));
  }

  getOrderStatus(orderId: number): Observable<PublicOrderStatus> {
    return this.http.get<PublicOrderStatus>(`/api/public/orders/${orderId}/status`)
      .pipe(catchError(this.handleError));
  }

  subscribeToOrderStatus(orderId: number): any {
    const topic = encodeURIComponent(`orders/status/${orderId}`);
    return new EventSource(`${environment.mercureUrl}?topic=${topic}`);
  }

  getLogoUrl(logo: string | null): string | null {
    if (!logo) return null;
    return `http://localhost:8008/uploads/logos/${logo}`;
  }

  private handleError(error: any): Observable<never> {
    const msg = error?.error?.error || error?.message || 'Erreur serveur';
    return throwError(() => new Error(msg));
  }
}
