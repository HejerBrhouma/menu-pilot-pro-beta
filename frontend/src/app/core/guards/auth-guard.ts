// src/app/core/guards/auth-guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const AuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token  = getActiveToken();

  if (!token) {
    router.navigate(['/login']);
    return false;
  }
  if (isTokenExpired(token)) {
    clearSession();
    router.navigate(['/login'], { queryParams: { reason: 'session_expired' } });
    return false;
  }
  return true;
};

export const AdminGuard: CanActivateFn = () => {
  const router         = inject(Router);
  const token          = getActiveToken();
  const isImpersonating = !!localStorage.getItem('impersonate_token');

  if (!token || isTokenExpired(token)) {
    clearSession();
    router.navigate(['/login'], { queryParams: { reason: 'session_expired' } });
    return false;
  }

  const roles = getRolesFromToken(token);

  // SUPER_ADMIN sans impersonation → son espace
  if (roles.includes('ROLE_SUPER_ADMIN') && !isImpersonating) {
    router.navigate(['/super-admin/dashboard']);
    return false;
  }

  // En impersonation, le token actif doit être ROLE_ADMIN (ou ROLE_MANAGER/WAITER)
  // On autorise l'accès si le token actif contient un rôle "admin-side"
  const allowedRoles = ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WAITER'];
  const hasAccess = roles.some(r => allowedRoles.includes(r));

  if (!hasAccess) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};

export const SuperAdminGuard: CanActivateFn = () => {
  const router = inject(Router);

  // ⚠️ TOUJOURS utiliser le token original, jamais l'impersonate_token
  const token          = localStorage.getItem('token');
  const isImpersonating = !!localStorage.getItem('impersonate_token');

  // Si on est en mode impersonation → bloquer l'accès au layout super-admin
  // (évite que les deux layouts coexistent)
  if (isImpersonating) {
    router.navigate(['/dashboard']);
    return false;
  }

  if (!token || isTokenExpired(token)) {
    clearSession();
    router.navigate(['/login']);
    return false;
  }

  const roles = getRolesFromToken(token);

  if (!roles.includes('ROLE_SUPER_ADMIN')) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};

// ── Helpers ───────────────────────────────────────────────────────────────

/** Retourne impersonate_token en priorité, sinon token normal */
export function getActiveToken(): string | null {
  return localStorage.getItem('impersonate_token')
    || localStorage.getItem('token');
}

export function getRolesFromToken(token: string): string[] {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.roles || payload.role || [];
  } catch {
    return [];
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function clearSession(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('impersonate_token');
}
