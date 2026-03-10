// src/app/core/services/category.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Category } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly url = '/api/categories';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Category[]> {
    return this.http.get<any>(this.url).pipe(
      map(res => res['hydra:member']),
      catchError(this.handleError)
    );
  }

  getOne(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.url}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  create(category: Omit<Category, 'id' | '@id'>): Observable<Category> {
    return this.http.post<Category>(this.url, category).pipe(
      catchError(this.handleError)
    );
  }

  update(id: number, category: Partial<Category>): Observable<Category> {
    return this.http.patch<Category>(`${this.url}/${id}`, category, {
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
