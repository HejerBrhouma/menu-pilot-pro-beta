// src/app/core/services/order.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Order, OrderStatus, Invoice, RestaurantTable } from '../models/order.model';
import { environment } from '../../../environments/environment';
@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly ordersUrl  = '/api/orders';
  private readonly tablesUrl  = '/api/tables';
  private readonly invoiceUrl = '/api/invoices';

  constructor(private http: HttpClient) {}

  // ── Commandes ──────────────────────────────────────────────────────

  getAll(filters?: { status?: string }): Observable<Order[]> {
    let url = this.ordersUrl;
    if (filters?.status) url += `?status=${filters.status}`;
    return this.http.get<any>(url).pipe(
      map(res => res['hydra:member']),
      catchError(this.handleError)
    );
  }

  getOne(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.ordersUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  create(data: Partial<Order>): Observable<Order> {
    return this.http.post<Order>(this.ordersUrl, data).pipe(
      catchError(this.handleError)
    );
  }

  update(id: number, data: Partial<Order>): Observable<Order> {
    return this.http.patch<Order>(`${this.ordersUrl}/${id}`, data, {
      headers: { 'Content-Type': 'application/merge-patch+json' }
    }).pipe(catchError(this.handleError));
  }

  changeStatus(id: number, status: OrderStatus): Observable<any> {
    return this.http.post(`${this.ordersUrl}/${id}/status`, { status }).pipe(
      catchError(this.handleError)
    );
  }

  generateInvoice(id: number, paymentMethod: string): Observable<{ invoiceId: number }> {
    return this.http.post<{ invoiceId: number }>(
      `${this.ordersUrl}/${id}/invoice`,
      { paymentMethod }
    ).pipe(catchError(this.handleError));
  }

  // ── Tables ─────────────────────────────────────────────────────────

  getTables(): Observable<RestaurantTable[]> {
    return this.http.get<any>(this.tablesUrl).pipe(
      map(res => res['hydra:member']),
      catchError(this.handleError)
    );
  }

  createTable(data: Partial<RestaurantTable>): Observable<RestaurantTable> {
    return this.http.post<RestaurantTable>(this.tablesUrl, data).pipe(
      catchError(this.handleError)
    );
  }

  updateTable(id: number, data: Partial<RestaurantTable>): Observable<RestaurantTable> {
    return this.http.patch<RestaurantTable>(`${this.tablesUrl}/${id}`, data, {
      headers: { 'Content-Type': 'application/merge-patch+json' }
    }).pipe(catchError(this.handleError));
  }

  deleteTable(id: number): Observable<void> {
    return this.http.delete<void>(`${this.tablesUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // ── Factures ───────────────────────────────────────────────────────

  getInvoices(): Observable<Invoice[]> {
    return this.http.get<any>(this.invoiceUrl).pipe(
      map(res => res['hydra:member']),
      catchError(this.handleError)
    );
  }

  getInvoice(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.invoiceUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // ── Mercure (temps réel) ───────────────────────────────────────────

  subscribeToOrders(establishmentId: number): EventSource {
    const mercureUrl = environment.mercureUrl;
    const topic      = encodeURIComponent(`orders/${establishmentId}`);
    return new EventSource(`${mercureUrl}?topic=${topic}`);
  }

  // ── Helpers ────────────────────────────────────────────────────────

  private handleError(error: any): Observable<never> {
    const msg = error?.error?.['hydra:description'] || error?.message || 'Erreur serveur';
    return throwError(() => new Error(msg));
  }
}
