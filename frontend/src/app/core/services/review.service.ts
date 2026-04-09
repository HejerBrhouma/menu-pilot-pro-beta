// src/app/core/services/review.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CustomerAuthService } from './customer-auth.service';

export interface Review {
  id:        number;
  rating:    number;
  comment:   string | null;
  photo:     string | null;
  isLiked:   boolean | null;
  createdAt: string;
  customer:  { firstName: string | null; lastName: string | null; avatar: string | null; };
}

export interface ReviewSummary {
  reviews:   Review[];
  count:     number;
  avgRating: number;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http        = inject(HttpClient);
  private authService = inject(CustomerAuthService);

  private get authHeaders(): HttpHeaders {
    return new HttpHeaders(this.authService.getAuthHeaders());
  }

  // ── Publics ───────────────────────────────────────────────────────

  getReviews(type: string, id: number): Observable<ReviewSummary> {
    return this.http.get<ReviewSummary>(`/api/public/reviews/${type}/${id}`);
  }

  // Récupérer une commande pour avis (anonyme ou connecté)
  getOrderForReview(orderId: number): Observable<any> {
    return this.http.get<any>(`/api/public/orders/${orderId}/review-info`);
  }

  createReview(data: {
    orderId:    number;
    targetType: string;
    targetId:   number;
    rating:     number;
    comment?:   string;
    isLiked?:   boolean | null;
    guestName?: string; // Pour les avis anonymes
  }): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(
      '/api/public/reviews',
      data,
      { headers: this.authHeaders }
    );
  }

  uploadReviewPhoto(reviewId: number, file: File): Observable<{ photo: string }> {
    const formData = new FormData();
    formData.append('photo', file);
    return this.http.post<{ photo: string }>(
      `/api/public/reviews/${reviewId}/photo`,
      formData,
      { headers: this.authHeaders }
    );
  }

  // ── Client connecté ───────────────────────────────────────────────

  getCustomerOrders(): Observable<any[]> {
    return this.http.get<any[]>(
      '/api/public/customer/orders',
      { headers: this.authHeaders }
    );
  }

  // ── Admin ─────────────────────────────────────────────────────────

  getPendingReviews(): Observable<any[]> {
    return this.http.get<any[]>('/api/reviews/pending');
  }

  moderateReview(id: number, action: 'approve' | 'reject'): Observable<any> {
    return this.http.post(`/api/reviews/${id}/moderate`, { action });
  }
}
