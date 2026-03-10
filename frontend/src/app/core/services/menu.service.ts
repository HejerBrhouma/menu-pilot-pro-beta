// src/app/core/services/menu.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Menu, MenuRead } from '../models/menu.model';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly url = '/api/menus';

  constructor(private http: HttpClient) {}

  getAll(page = 1, perPage = 10): Observable<{ items: MenuRead[]; total: number }> {
    const params = new HttpParams()
      .set('page', page)
      .set('itemsPerPage', perPage);
    return this.http.get<any>(this.url, { params }).pipe(
      map(res => ({ items: res['hydra:member'], total: res['hydra:totalItems'] })),
      catchError(this.handleError)
    );
  }

  getOne(id: number): Observable<MenuRead> {
    return this.http.get<MenuRead>(`${this.url}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getByQrToken(token: string): Observable<MenuRead> {
    return this.http.get<any>(`/api/menus?qrToken=${token}`).pipe(
      map((res: any) => {
        const member = res['hydra:member'];
        if (!member || member.length === 0) {
          throw new Error('Menu introuvable');
        }
        return member[0] as MenuRead;
      }),
      catchError(this.handleError)
    );
  }

  create(menu: Omit<Menu, 'id' | '@id' | 'qrToken' | 'createdAt'>): Observable<MenuRead> {
    return this.http.post<MenuRead>(this.url, menu).pipe(
      catchError(this.handleError)
    );
  }

  update(id: number, menu: Partial<Menu>): Observable<MenuRead> {
    return this.http.patch<MenuRead>(`${this.url}/${id}`, menu, {
      headers: { 'Content-Type': 'application/merge-patch+json' }
    }).pipe(catchError(this.handleError));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  toggleActive(id: number, isActive: boolean): Observable<MenuRead> {
    return this.update(id, { isActive });
  }

  private handleError(error: any): Observable<never> {
    const msg = error?.error?.['hydra:description'] || error?.message || 'Erreur serveur';
    return throwError(() => new Error(msg));
  }
}
