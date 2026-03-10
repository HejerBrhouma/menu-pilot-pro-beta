// src/app/core/services/pack.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Pack, PackRead } from '../models/pack.model';

@Injectable({ providedIn: 'root' })
export class PackService {
  private readonly url = '/api/packs';

  constructor(private http: HttpClient) {}

  getAll(page = 1, perPage = 10): Observable<{ items: PackRead[]; total: number }> {
    const params = new HttpParams()
      .set('page', page)
      .set('itemsPerPage', perPage);
    return this.http.get<any>(this.url, { params }).pipe(
      map(res => ({ items: res['hydra:member'], total: res['hydra:totalItems'] })),
      catchError(this.handleError)
    );
  }

  getOne(id: number): Observable<PackRead> {
    return this.http.get<PackRead>(`${this.url}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  create(pack: Omit<Pack, 'id' | '@id'>): Observable<PackRead> {
    return this.http.post<PackRead>(this.url, pack).pipe(
      catchError(this.handleError)
    );
  }

  update(id: number, pack: Partial<Pack>): Observable<PackRead> {
    return this.http.patch<PackRead>(`${this.url}/${id}`, pack, {
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
