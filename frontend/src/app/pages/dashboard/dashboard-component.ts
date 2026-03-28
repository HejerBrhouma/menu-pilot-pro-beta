// src/app/pages/dashboard/dashboard-component.ts

import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ProductService }   from '../../core/services/product.service';
import { CategoryService }  from '../../core/services/category.service';
import { PackService }      from '../../core/services/pack.service';
import { OrderService }     from '../../core/services/order.service';
import { PromotionService } from '../../core/services/promotion.service';
import { ReviewService }    from '../../core/services/review.service';
import { AuthService }      from '../../core/services/auth-service';

export interface KpiCard {
  label    : string;
  value    : number | string;
  icon     : string;
  colorVar : string;   // CSS variable or hex
  bgVar    : string;
  route    : string;
  alert?   : boolean;
}

export interface QuickAction {
  label  : string;
  icon   : string;
  route  : string;
  color  : string;
}

@Component({
  selector   : 'app-dashboard',
  standalone : true,
  imports    : [
    CommonModule, RouterModule,
    MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatTooltipModule
  ],
  templateUrl: './dashboard-component.html',
  styleUrls  : ['./dashboard-component.scss']
})
export class DashboardComponent implements OnInit {

  loading     = true;
  greeting    = '';
  currentDate = new Date();
  userName    = '';

  // KPI values
  pendingOrders      = 0;
  confirmedOrders    = 0;
  todayRevenue       = 0;
  totalProducts      = 0;
  totalPacks         = 0;
  activePromos       = 0;
  pendingReviewsCount = 0;

  recentOrders: any[] = [];

  kpis: KpiCard[] = [
    { label: 'Commandes en attente', value: '—', icon: 'pending_actions',  colorVar: '#ef4444', bgVar: '#fee2e2', route: '/orders',     alert: false },
    { label: 'Chiffre du jour',      value: '—', icon: 'payments',         colorVar: '#10b981', bgVar: '#d1fae5', route: '/invoices',   alert: false },
    { label: 'En cours',             value: '—', icon: 'restaurant',        colorVar: '#3b82f6', bgVar: '#eff6ff', route: '/orders',     alert: false },
    { label: 'Produits',             value: '—', icon: 'inventory_2',       colorVar: '#6366f1', bgVar: '#eef2ff', route: '/products',   alert: false },
    { label: 'Packs actifs',         value: '—', icon: 'layers',            colorVar: '#f59e0b', bgVar: '#fef3c7', route: '/packs',      alert: false },
    { label: 'Promos actives',       value: '—', icon: 'local_offer',       colorVar: '#8b5cf6', bgVar: '#ede9fe', route: '/promotions', alert: false },
  ];

  quickActions: QuickAction[] = [
    { label: 'Nouvelle commande', icon: 'add_shopping_cart', route: '/orders/new', color: '#ef4444' },
    { label: 'Nouveau produit',   icon: 'add_circle',        route: '/products',   color: '#6366f1' },
    { label: 'Nouveau pack',      icon: 'add_box',           route: '/packs',      color: '#f59e0b' },
    { label: 'Nouvelle promo',    icon: 'local_offer',       route: '/promotions', color: '#8b5cf6' },
    { label: 'Tables & QR',       icon: 'qr_code_scanner',   route: '/tables',     color: '#10b981' },
    { label: 'Mon équipe',        icon: 'badge',             route: '/staff',      color: '#3b82f6' },
    { label: 'Avis clients',      icon: 'star_rate',         route: '/reviews',    color: '#d97706' },
    { label: 'Factures',          icon: 'receipt',           route: '/invoices',   color: '#14b8a6' },
  ];

  modules = [
    { label: 'Commandes',    desc: 'Gérez les commandes en temps réel', icon: 'receipt_long',     route: '/orders',     grad: 'linear-gradient(135deg,#ef4444,#dc2626)' },
    { label: 'Tables',       desc: 'Configurez tables et QR codes',     icon: 'table_restaurant', route: '/tables',     grad: 'linear-gradient(135deg,#10b981,#059669)' },
    { label: 'Produits',     desc: 'Catalogue, prix et disponibilités', icon: 'inventory_2',      route: '/products',   grad: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
    { label: 'Packs',        desc: 'Créez des formules attractives',    icon: 'layers',           route: '/packs',      grad: 'linear-gradient(135deg,#f59e0b,#d97706)' },
    { label: 'Promotions',   desc: 'Promos par période ou événement',   icon: 'local_offer',      route: '/promotions', grad: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
    { label: 'Factures',     desc: 'Consultez et imprimez vos factures',icon: 'receipt',          route: '/invoices',   grad: 'linear-gradient(135deg,#14b8a6,#0d9488)' },
    { label: 'Mon équipe',   desc: 'Gérez personnel et accès',          icon: 'badge',            route: '/staff',      grad: 'linear-gradient(135deg,#3b82f6,#2563eb)' },
    { label: 'Avis clients', desc: 'Consultez et gérez vos avis',       icon: 'star_rate',        route: '/reviews',    grad: 'linear-gradient(135deg,#f59e0b,#d97706)' },
    { label: 'Menu QR',      desc: 'Partagez votre menu digital',       icon: 'qr_code_2',        route: '/qr-code',    grad: 'linear-gradient(135deg,#ec4899,#be185d)' },
  ];

  private productService   = inject(ProductService);
  private categoryService  = inject(CategoryService);
  private packService      = inject(PackService);
  private orderService     = inject(OrderService);
  private promotionService = inject(PromotionService);
  private reviewService    = inject(ReviewService);
  private authService      = inject(AuthService);
  private cdr              = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.setGreeting();
    this.setUserName();
    this.loadStats();
  }

  setGreeting(): void {
    const h = new Date().getHours();
    this.greeting = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
  }

  setUserName(): void {
    const user = this.authService.getCurrentUser();
    this.userName = user?.firstName || user?.email?.split('@')[0] || '';
  }

  loadStats(): void {
    const today = new Date().toISOString().slice(0, 10);

    forkJoin({
      products : this.productService.getAll(1, 1).pipe(catchError(() => of({ total: 0 }))),
      packs    : this.packService.getAll(1, 1).pipe(catchError(() => of({ total: 0 }))),
      orders   : this.orderService.getAll().pipe(catchError(() => of([]))),
      promos   : this.promotionService.getActive().pipe(catchError(() => of([]))),
      reviews  : this.reviewService.getPendingReviews().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ products, packs, orders, promos, reviews }) => {

        // Orders breakdown
        const pending   = (orders as any[]).filter(o => o.status === 'PENDING');
        const confirmed = (orders as any[]).filter(o => o.status === 'CONFIRMED');
        const todayPaid = (orders as any[]).filter(o => o.status === 'PAID' &&
          (o.createdAt ?? '').slice(0, 10) === today);

        this.pendingOrders       = pending.length;
        this.confirmedOrders     = confirmed.length;
        this.todayRevenue        = todayPaid.reduce((s: number, o: any) => s + (o.total ?? 0), 0);
        this.totalProducts       = (products as any).total ?? 0;
        this.totalPacks          = (packs as any).total ?? 0;
        this.activePromos        = (promos as any[]).length;
        this.pendingReviewsCount = (reviews as any[]).length;

        // Recent orders (last 5)
        this.recentOrders = [...(orders as any[])]
          .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
          .slice(0, 5);

        // Fill KPI cards
        this.kpis[0].value = this.pendingOrders;
        this.kpis[0].alert = this.pendingOrders > 0;
        this.kpis[1].value = this.todayRevenue.toFixed(2) + ' TND';
        this.kpis[2].value = this.confirmedOrders;
        this.kpis[3].value = this.totalProducts;
        this.kpis[4].value = this.totalPacks;
        this.kpis[5].value = this.activePromos;

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING  : 'En attente',
      CONFIRMED: 'En cours',
      SERVED   : 'Servi',
      PAID     : 'Payé',
      CANCELLED: 'Annulé',
    };
    return map[status] ?? status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING  : 'warning',
      CONFIRMED: 'primary',
      SERVED   : 'success',
      PAID     : 'success',
      CANCELLED: 'danger',
    };
    return map[status] ?? '';
  }
}
