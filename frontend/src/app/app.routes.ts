// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { AdminGuard, SuperAdminGuard } from './core/guards/auth-guard';

export const routes: Routes = [

  // ── Authentification ──────────────────────────────────────────────────
  {
    path: 'login',
    component: LoginComponent,
    title: 'Connexion'
  },

  // ── Pages publiques (sans auth) ───────────────────────────────────────
  {
    path: 'menu/:token',
    title: 'Menu Digital',
    loadComponent: () =>
      import('./pages/menu-public/menu-public.component')
        .then(m => m.MenuPublicComponent)
  },
  {
    path: 'r/:slug',
    title: 'Notre Enseigne',
    loadComponent: () =>
      import('./pages/establishment-public/establishment-public.component')
        .then(m => m.EstablishmentPublicComponent)
  },
  {
    path: 'table/:token',
    loadComponent: () => import('./pages/public/table-menu/table-menu.component')
      .then(m => m.TableMenuComponent)
  },
  {
    path: 'order-confirmed',
    loadComponent: () => import('./pages/public/order-confirmed/order-confirmed.component')
      .then(m => m.OrderConfirmedComponent)
  },

  // ── SUPER ADMIN ───────────────────────────────────────────────────────
  {
    path: 'super-admin',
    canActivate: [SuperAdminGuard],
    loadComponent: () =>
      import('./layout/super-admin-layout/super-admin-layout')
        .then(m => m.SuperAdminLayout),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        title: 'Super Admin — Dashboard',
        loadComponent: () =>
          import('./pages/super-admin/dashboard/super-admin-dashboard.component')
            .then(m => m.SuperAdminDashboardComponent)
      },
      {
        path: 'establishments',
        title: 'Toutes les enseignes',
        loadComponent: () =>
          import('./pages/super-admin/establishments/establishments-list/establishments-list.component')
            .then(m => m.EstablishmentsListComponent)
      },
      {
        path: 'establishments/new',
        title: 'Nouvelle enseigne',
        loadComponent: () =>
          import('./pages/super-admin/establishments/establishment-create/establishment-create.component')
            .then(m => m.EstablishmentCreateComponent)
      },
      {
        path: 'users',
        title: 'Gestion utilisateurs',
        loadComponent: () =>
          import('./pages/super-admin/users/users-list/users-list.component')
            .then(m => m.UsersListComponent)
      },
    ]
  },

  // ── ADMIN (layout avec sidebar) ───────────────────────────────────────
  {
    path: '',
    canActivate: [AdminGuard],
    loadComponent: () =>
      import('./layout/layout').then(m => m.Layout),
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
        path: 'establishment',
        title: 'Mon Enseigne',
        loadComponent: () =>
          import('./pages/dashboard/establishment/establishment.component')
            .then(m => m.EstablishmentComponent)
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
        path: 'orders',
        title: 'Commandes',
        loadComponent: () =>
          import('./pages/dashboard/orders/orders-list/orders-list.component')
            .then(m => m.OrdersListComponent)
      },
      {
        path: 'orders/new',
        title: 'Commandes',
        loadComponent: () =>
          import('./pages/dashboard/orders/order-new/order-new.component')
            .then(m => m.OrderNewComponent)
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./pages/dashboard/orders/order-detail/order-detail.component')
          .then(m => m.OrderDetailComponent)
      },
      { path: 'invoices',
        title: 'Factures',
        loadComponent: () => import('./pages/dashboard/invoices/invoices-list/invoices-list.component')
          .then(m => m.InvoicesListComponent) },
      { path: 'invoices/:id',
        loadComponent: () => import('./pages/dashboard/invoices/invoice-detail/invoice-detail.component')
          .then(m => m.InvoiceDetailComponent) },
      {
        path: 'tables',
        title: 'Tables',
        loadComponent: () =>
          import('./pages/dashboard/tables/tables.component')
            .then(m => m.TablesComponent)
      },
      {
        path: 'qr-code',
        title: 'QR Code',
        loadComponent: () =>
          import('./pages/dashboard/qr-code/qr.code.component')
            .then(m => m.QrCodeComponent)
      },
      {
        path: 'promotions',
        title: 'Promotions',
        loadComponent: () =>
          import('./pages/dashboard/promotions/promotions.component')
            .then(m => m.PromotionsComponent)
      },
      {
        path: 'staff',
        title: 'Personnel',
        loadComponent: () =>
          import('./pages/dashboard/staff/staff.component')
            .then(m => m.StaffComponent)
      },
    ]
  },

  // ── Fallback ──────────────────────────────────────────────────────────
  { path: '**', redirectTo: 'login' }

];
