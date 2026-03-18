// src/app/core/services/promotion.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Promotion, PromotionConflict, ConflictResolution } from '../models/promotion.model';

@Injectable({ providedIn: 'root' })
export class PromotionService {
  private readonly url         = '/api/promotions';
  private readonly conflictUrl = '/api/promotion_conflicts';

  constructor(private http: HttpClient) {}

  // ── Promotions ────────────────────────────────────────────────────────

  getAll(): Observable<Promotion[]> {
    return this.http.get<any>(this.url).pipe(
      map(res => res['hydra:member']),
      catchError(this.handleError)
    );
  }

  getActive(): Observable<Promotion[]> {
    return this.http.get<any>(`${this.url}?isActive=true`).pipe(
      map(res => res['hydra:member']),
      catchError(this.handleError)
    );
  }

  create(data: Partial<Promotion>): Observable<Promotion> {
    return this.http.post<Promotion>(this.url, data).pipe(
      catchError(this.handleError)
    );
  }

  update(id: number, data: Partial<Promotion>): Observable<Promotion> {
    return this.http.patch<Promotion>(`${this.url}/${id}`, data, {
      headers: { 'Content-Type': 'application/merge-patch+json' }
    }).pipe(catchError(this.handleError));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // ── Conflits ──────────────────────────────────────────────────────────

  getUnresolvedConflicts(): Observable<PromotionConflict[]> {
    return this.http.get<any>(`${this.conflictUrl}?isResolved=false`).pipe(
      map(res => res['hydra:member']),
      catchError(this.handleError)
    );
  }

  resolveConflict(id: number, resolution: ConflictResolution): Observable<PromotionConflict> {
    return this.http.patch<PromotionConflict>(`${this.conflictUrl}/${id}`, { resolution }, {
      headers: { 'Content-Type': 'application/merge-patch+json' }
    }).pipe(catchError(this.handleError));
  }

  // ── Calcul prix ───────────────────────────────────────────────────────

  /** Calcule le prix réduit côté frontend (pour affichage instantané) */
  calculatePrice(originalPrice: number, promotions: Promotion[], resolution: 'CUMUL' | 'BEST' = 'BEST'): number {
    if (!promotions.length) return originalPrice;

    if (promotions.length === 1) {
      return this.applyPromo(originalPrice, promotions[0]);
    }

    if (resolution === 'CUMUL') {
      let price = originalPrice;
      promotions.forEach(p => price = this.applyPromo(price, p));
      return Math.round(price * 100) / 100;
    } else {
      // BEST
      const prices = promotions.map(p => this.applyPromo(originalPrice, p));
      return Math.min(...prices);
    }
  }

  private applyPromo(price: number, promo: Promotion): number {
    if (promo.type === 'PERCENTAGE') {
      return Math.round(price * (1 - promo.value / 100) * 100) / 100;
    }
    return Math.max(0, Math.round((price - promo.value) * 100) / 100);
  }

  private handleError(error: any): Observable<never> {
    const msg = error?.error?.['hydra:description'] || error?.message || 'Erreur serveur';
    return throwError(() => new Error(msg));
  }
}
