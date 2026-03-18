// src/app/core/services/establishment.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Establishment } from '../models/establishment.model';

@Injectable({ providedIn: 'root' })
export class EstablishmentService {
  private readonly url = '/api/establishments';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Establishment[]> {
    return this.http.get<any>(this.url).pipe(
      map(res => res['hydra:member']),
      catchError(this.handleError)
    );
  }

  getOne(id: number): Observable<Establishment> {
    return this.http.get<Establishment>(`${this.url}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getBySlug(slug: string): Observable<Establishment> {
    return this.http.get<any>(`${this.url}?slug=${slug}`).pipe(
      map(res => {
        const member = res['hydra:member'];
        if (!member?.length) throw new Error('Établissement introuvable');
        return member[0] as Establishment;
      }),
      catchError(this.handleError)
    );
  }

  create(data: Omit<Establishment, 'id' | '@id' | 'createdAt' | 'updatedAt'>): Observable<Establishment> {
    return this.http.post<Establishment>(this.url, data).pipe(
      catchError(this.handleError)
    );
  }

  update(id: number, data: Partial<Establishment>): Observable<Establishment> {
    return this.http.patch<Establishment>(`${this.url}/${id}`, data, {
      headers: { 'Content-Type': 'application/merge-patch+json' }
    }).pipe(catchError(this.handleError));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  uploadLogo(id: number, file: File): Observable<{ logo: string; url: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.http.post<{ logo: string; url: string }>(
      `${this.url}/${id}/logo`, formData
    ).pipe(catchError(this.handleError));
  }

  getLogoUrl(filename: string | undefined): string {
    if (!filename) return '/assets/default-logo.png';
    if (filename.startsWith('http')) return filename;
    return `http://localhost:8008/uploads/logos/${filename}`;
  }

  private handleError(error: any): Observable<never> {
    const msg = error?.error?.['hydra:description'] || error?.message || 'Erreur serveur';
    return throwError(() => new Error(msg));
  }
}
