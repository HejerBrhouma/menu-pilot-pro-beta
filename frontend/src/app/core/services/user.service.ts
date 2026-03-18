import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AppUser } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly url = '/api/users';

  constructor(private http: HttpClient) {}

  getAll(): Observable<AppUser[]> {
    return this.http.get<any>(this.url).pipe(
      map(res => res['hydra:member'] || []),
      catchError(this.handleError)
    );
  }

  getByEstablishment(establishmentId: number): Observable<AppUser[]> {
    return this.http.get<any>(`${this.url}?establishment=${establishmentId}`).pipe(
      map(res => res['hydra:member'] || []),
      catchError(this.handleError)
    );
  }

  getOne(id: number): Observable<AppUser> {
    return this.http.get<AppUser>(`${this.url}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  create(data: Partial<AppUser> & { password: string }): Observable<AppUser> {
    return this.http.post<AppUser>(this.url, data).pipe(
      catchError(this.handleError)
    );
  }

  update(id: number, data: Partial<AppUser>): Observable<AppUser> {
    return this.http.patch<AppUser>(`${this.url}/${id}`, data, {
      headers: { 'Content-Type': 'application/merge-patch+json' }
    }).pipe(catchError(this.handleError));
  }

  resetPassword(id: number, password: string): Observable<AppUser> {
    return this.http.patch<AppUser>(`${this.url}/${id}`, { password }, {
      headers: { 'Content-Type': 'application/merge-patch+json' }
    }).pipe(catchError(this.handleError));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  toggleActive(id: number, isActive: boolean): Observable<AppUser> {
    return this.http.patch<AppUser>(`${this.url}/${id}`, { isActive }, {
      headers: { 'Content-Type': 'application/merge-patch+json' }
    }).pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    const msg = error?.error?.['hydra:description'] || error?.message || 'Erreur serveur';
    return throwError(() => new Error(msg));
  }
}
