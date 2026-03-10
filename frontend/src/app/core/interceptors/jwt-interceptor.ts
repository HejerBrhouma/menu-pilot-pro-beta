// src/app/core/interceptors/jwt-interceptor.ts

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  // Routes publiques — pas de token JWT
  const isPublicRoute =
    req.url.includes('/api/login') ||
    req.url.includes('/api/token/refresh') ||
    req.url.includes('/api/register') ||
    (req.url.includes('/api/menus') && req.url.includes('qrToken')); // ← QR public

  const authReq = token && !isPublicRoute
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 uniquement sur routes protégées → redirect login
      if (
        error.status === 401 &&
        !isPublicRoute &&
        !router.url.includes('/login')
      ) {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        router.navigate(['/login'], {
          queryParams: { reason: 'session_expired' }
        });
      }
      return throwError(() => error);
    })
  );
};
