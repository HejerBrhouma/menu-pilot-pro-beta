// src/app/core/services/rating-cache.service.ts
// Cache des notes moyennes pour éviter trop de requêtes

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface RatingSummary {
  avgRating: number;
  count:     number;
}

@Injectable({ providedIn: 'root' })
export class RatingCacheService {
  private http  = inject(HttpClient);
  private cache = new Map<string, Observable<RatingSummary>>();

  getRating(type: string, id: number): Observable<RatingSummary> {
    const key = `${type}:${id}`;

    if (!this.cache.has(key)) {
      const obs = this.http.get<any>(`/api/public/reviews/${type}/${id}`).pipe(
        map(res => ({ avgRating: res.avgRating || 0, count: res.count || 0 })),
        catchError(() => of({ avgRating: 0, count: 0 })),
        shareReplay(1)
      );
      this.cache.set(key, obs);
    }

    return this.cache.get(key)!;
  }

  clearCache(): void { this.cache.clear(); }
}
