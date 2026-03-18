// src/app/core/services/impersonate.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth-service';

@Injectable({ providedIn: 'root' })
export class ImpersonateService {

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * SUPER_ADMIN prend la main d'un ADMIN
   * Symfony doit exposer une route POST /api/impersonate/{userId}
   * qui retourne un JWT signé au nom de cet user
   */
  impersonateUser(userId: number): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`/api/impersonate/${userId}`, {}).pipe(
      tap(res => {
        localStorage.setItem('impersonate_token', res.token);
        const user = this.decodeToken(res.token);
        // Rediriger selon le rôle de l'impersonné
        if (user?.roles?.includes('ROLE_ADMIN')) {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      }),
      catchError(err => throwError(() => err))
    );
  }

  stopImpersonation(): void {
    localStorage.removeItem('impersonate_token');
    // Restaurer l'user original depuis le token principal
    const token = localStorage.getItem('token');
    if (token) {
      const user = this.decodeToken(token);
      if (user?.roles?.includes('ROLE_SUPER_ADMIN')) {
        this.router.navigate(['/super-admin/dashboard']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  isImpersonating(): boolean {
    return !!localStorage.getItem('impersonate_token');
  }

  private decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }
}
