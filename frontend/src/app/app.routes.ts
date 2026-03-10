import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth-guard';
import { LoginComponent } from './auth/login/login';

export const routes: Routes = [

  // ── Authentification ──────────────────────────────────────────────────
  {
    path: 'login',
    component: LoginComponent,
    title: 'Connexion'
  },

  // ── Page publique QR — HORS layout, HORS AuthGuard ───────────────────
  {
    path: 'menu/:token',
    loadComponent: () =>
      import('./pages/menu-public/menu-public.component')
        .then(m => m.MenuPublicComponent),
    title: 'Menu Digital'
  },

  // ── Layout protégé ────────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./layout/layout')
        .then(m => m.Layout),
    canActivate: [AuthGuard],   // ← AuthGuard sur TOUT le layout
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        title: 'Dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard-component')
            .then(m => m.DashboardComponent)
      },
      {
        path: 'products',
        title: 'Produits',
        loadComponent: () =>
          import('./pages/dashboard/product/product.component')
            .then(m => m.ProductComponent)
      },
      {
        path: 'categories',
        title: 'Catégories',
        loadComponent: () =>
          import('./pages/dashboard/category/category.component')
            .then(m => m.CategoryComponent)
      },
      {
        path: 'packs',
        title: 'Packs',
        loadComponent: () =>
          import('./pages/dashboard/pack/pack.component')
            .then(m => m.PackComponent)
      },
      {
        path: 'menu',
        title: 'Menus',
        loadComponent: () =>
          import('./pages/dashboard/menu/menu.component')
            .then(m => m.MenuComponent)
      },
      {
        path: 'qr-code',
        title: 'QR Code',
        loadComponent: () =>
          import('./pages/dashboard/qr-code/qr.code.component')
            .then(m => m.QrCodeComponent)
      },
    ]
  },

  // ── Fallback ──────────────────────────────────────────────────────────
  { path: '**', redirectTo: 'login' }

];
