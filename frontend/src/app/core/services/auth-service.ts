// src/app/core/services/auth-service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { User, AuthResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromToken());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/login_check', { email, password }).pipe(
      tap(res => this.handleAuthSuccess(res)),
      catchError(this.handleError)
    );
  }

  socialLogin(provider: string, token: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`/api/auth/${provider}`, { token }).pipe(
      tap(res => this.handleAuthSuccess(res)),
      catchError(this.handleError)
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    return this.http.post<AuthResponse>('/api/token/refresh', { refresh_token: refreshToken }).pipe(
      tap(res => this.handleAuthSuccess(res)),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('impersonate_token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // ── Rôles ─────────────────────────────────────────────────────────────
  isSuperAdmin(): boolean {
    return this.getCurrentUser()?.roles?.includes('ROLE_SUPER_ADMIN') ?? false;
  }

  isAdmin(): boolean {
    return this.getCurrentUser()?.roles?.includes('ROLE_ADMIN') ?? false;
  }

  isManager(): boolean {
    return this.getCurrentUser()?.roles?.includes('ROLE_MANAGER') ?? false;
  }

  isWaiter(): boolean {
    return this.getCurrentUser()?.roles?.includes('ROLE_WAITER') ?? false;
  }

  /** Peut gérer l'équipe et l'enseigne (ADMIN uniquement) */
  canManage(): boolean {
    return this.isAdmin() || this.isManager();
  }

  /** Peut voir sans modifier (MANAGER + WAITER) */
  isReadOnly(): boolean {
    return this.isManager() || this.isWaiter();
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch { return false; }
  }

  // ── Impersonation ─────────────────────────────────────────────────────
  impersonate(adminToken: string): void {
    localStorage.setItem('impersonate_token', adminToken);
    const user = this.decodeToken(adminToken);
    this.currentUserSubject.next(user);
    this.router.navigate(['/dashboard']);
  }

  stopImpersonation(): void {
    localStorage.removeItem('impersonate_token');
    const token = localStorage.getItem('token');
    const user = token ? this.decodeToken(token) : null;
    this.currentUserSubject.next(user);
    this.router.navigate(['/super-admin/dashboard']);
  }

  isImpersonating(): boolean {
    return !!localStorage.getItem('impersonate_token');
  }

  // ── Helpers privés ────────────────────────────────────────────────────
  private handleAuthSuccess(res: AuthResponse): void {
    if (res.token) {
      localStorage.setItem('token', res.token);
      if (res.refresh_token) {
        localStorage.setItem('refresh_token', res.refresh_token);
      }
      const user = this.decodeToken(res.token);
      this.currentUserSubject.next(user);

      if (user?.roles?.includes('ROLE_SUPER_ADMIN')) {
        this.router.navigate(['/super-admin/dashboard']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }
  }

  private decodeToken(token: string): User | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id:        payload.id,
        email:     payload.email,
        firstName: payload.firstName,
        lastName:  payload.lastName,
        roles:     payload.roles || [],
        isActive:  payload.isActive ?? true,
      };
    } catch { return null; }
  }

  private getUserFromToken(): User | null {
    const token = localStorage.getItem('impersonate_token')
      || localStorage.getItem('token');
    return token ? this.decodeToken(token) : null;
  }

  private handleError(error: any): Observable<never> {
    const msg = error?.error?.message || 'Erreur de connexion';
    return throwError(() => new Error(msg));
  }
}
