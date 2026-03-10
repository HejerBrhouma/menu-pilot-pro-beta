// src/app/core/services/auth-service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthResponse, User } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly API_URL   = '/api';
  private readonly JWT_KEY   = 'jwt_token';
  private readonly REFRESH_KEY = 'refresh_token';
  private readonly USER_KEY  = 'current_user';

  // État réactif de l'utilisateur connecté
  private currentUserSubject = new BehaviorSubject<User | null>(this.loadUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  // ── Authentification ──────────────────────

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login_check`, { email, password }).pipe(
      tap(res => this.storeSession(res)),
      tap(() => this.router.navigate(['/dashboard'])),
      catchError(this.handleError)
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, userData).pipe(
      catchError(this.handleError)
    );
  }

  socialLogin(provider: string, token: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login/${provider}`, { accessToken: token }).pipe(
      tap(res => this.storeSession(res)),
      tap(() => this.router.navigate(['/dashboard'])),
      catchError(this.handleError)
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(this.REFRESH_KEY);
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('Session expirée'));
    }

    return this.http.post<AuthResponse>(`${this.API_URL}/token/refresh`, { refresh_token: refreshToken }).pipe(
      tap(res => this.storeSession(res)),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.JWT_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  // ── Utilisateur courant ───────────────────

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  fetchCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/me`).pipe(
      tap(user => {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUserSubject.next(user);
      }),
      catchError(this.handleError)
    );
  }

  // ── Tokens ────────────────────────────────

  getJwtToken(): string | null {
    return localStorage.getItem(this.JWT_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getJwtToken();
  }

  // ── Helpers privés ────────────────────────

  private storeSession(response: AuthResponse): void {
    if (response.token) {
      localStorage.setItem(this.JWT_KEY, response.token);
    }
    if (response.refresh_token) {
      localStorage.setItem(this.REFRESH_KEY, response.refresh_token);
    }
    // Si l'API retourne l'utilisateur dans la réponse de login
    if (response.user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
      this.currentUserSubject.next(response.user);
    }
  }

  private loadUserFromStorage(): User | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private handleError(error: any): Observable<never> {
    const msg = error?.error?.message || error?.message || 'Une erreur est survenue';
    return throwError(() => new Error(msg));
  }
}
