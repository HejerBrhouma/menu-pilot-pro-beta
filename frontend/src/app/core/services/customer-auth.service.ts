// src/app/core/services/customer-auth.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface CustomerAccount {
  id:        number;
  email:     string;
  firstName: string | null;
  lastName:  string | null;
  fullName:  string;
  avatar:    string | null;
  createdAt: string;
}

export interface AuthResponse {
  token:    string;
  customer: CustomerAccount;
}

@Injectable({ providedIn: 'root' })
export class CustomerAuthService {
  private http = inject(HttpClient);

  private readonly TOKEN_KEY    = 'customer_token';
  private readonly CUSTOMER_KEY = 'customer_data';

  private customerSubject = new BehaviorSubject<CustomerAccount | null>(this.loadCustomer());
  customer$ = this.customerSubject.asObservable();

  get currentCustomer(): CustomerAccount | null { return this.customerSubject.value; }
  get isLoggedIn(): boolean { return !!this.currentCustomer; }
  get token(): string | null { return localStorage.getItem(this.TOKEN_KEY); }

  register(data: {
    email: string; password: string;
    firstName?: string; lastName?: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/public/customer/register', data)
      .pipe(tap(res => this.saveSession(res)));
  }

  login(data: {
    email: string; password: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/public/customer/login', data)
      .pipe(tap(res => this.saveSession(res)));
  }

  loginWithGoogle(token: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/public/customer/oauth/google', {
      token
    }).pipe(tap(res => this.saveSession(res)));
  }

  loginWithFacebook(accessToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/public/customer/oauth/facebook', {
      accessToken
    }).pipe(tap(res => this.saveSession(res)));
  }

  updateProfile(data: {
    firstName?: string;
    lastName?:  string;
    currentPassword?: string;
    newPassword?:     string;
  }): Observable<AuthResponse> {
    return this.http.patch<AuthResponse>('/api/public/customer/profile', data)
      .pipe(tap(res => this.saveSession(res)));
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.CUSTOMER_KEY);
    this.customerSubject.next(null);
  }

  private saveSession(res: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    localStorage.setItem(this.CUSTOMER_KEY, JSON.stringify(res.customer));
    this.customerSubject.next(res.customer);
  }

  private loadCustomer(): CustomerAccount | null {
    try {
      const raw = localStorage.getItem(this.CUSTOMER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  getAuthHeaders(): { Authorization: string } | {} {
    const token = this.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}
