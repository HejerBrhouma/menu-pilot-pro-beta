import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const AuthGuard: CanActivateFn = () => {
  const router = inject(Router);

  const token = localStorage.getItem('token');

  // Pas de token → login
  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  // Vérifier l'expiration du JWT
  if (isTokenExpired(token)) {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    router.navigate(['/login'], {
      queryParams: { reason: 'session_expired' }
    });
    return false;
  }

  return true;
};

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    // exp est en secondes, Date.now() en millisecondes
    return payload.exp * 1000 < Date.now();
  } catch {
    // Token malformé → considéré expiré
    return true;
  }
}
