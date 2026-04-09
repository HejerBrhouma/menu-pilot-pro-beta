// src/app/core/interceptors/jwt-interceptor.ts

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { getActiveToken, isTokenExpired, clearSession } from '../guards/auth-guard';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Routes publiques — pas de token JWT
  const isPublicRoute =
    req.url.includes('/api/login') ||
    req.url.includes('/api/token/refresh') ||
    req.url.includes('/api/register') ||
    req.url.includes('/api/auth/google') ||
    req.url.includes('/api/public/') ||
    // Galerie et catalogue publics (page enseigne)
    (req.method === 'GET' && req.url.includes('/api/gallery')) ||
    // Établissement : UNIQUEMENT la recherche par slug (page publique /nom-enseigne)
    (req.method === 'GET' && req.url.includes('/api/establishments') && req.url.includes('slug=')) ||
    // Menu, produits, catégories, packs publics UNIQUEMENT depuis la page publique (pas de token dispo)
    (req.method === 'GET' && req.url.includes('/api/menus') && req.url.includes('qrToken=')) ||
    (req.method === 'GET' && req.url.includes('/api/menus') && req.url.includes('establishment=')) ||
    (req.method === 'GET' && req.url.includes('/api/products') && req.url.includes('establishment=')) ||
    (req.method === 'GET' && req.url.includes('/api/categories') && req.url.includes('establishment=')) ||
    (req.method === 'GET' && req.url.includes('/api/packs') && req.url.includes('establishment='));

  // Utiliser impersonate_token si dispo, sinon token normal
  const token = getActiveToken();

  const authReq = token && !isPublicRoute
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status === 401 &&
        !isPublicRoute &&
        !router.url.includes('/login')
      ) {
        clearSession();
        router.navigate(['/login'], {
          queryParams: { reason: 'session_expired' }
        });
      }
      return throwError(() => error);
    })
  );
};
