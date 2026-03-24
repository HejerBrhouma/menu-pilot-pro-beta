// src/app/pages/dashboard/dashboard-component.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { PackService } from '../../core/services/pack.service';
import { OrderService } from '../../core/services/order.service';
import { PromotionService } from '../../core/services/promotion.service';

export interface StatCard {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  accent: string;
  route: string;
  badge?: string;
}

export interface QuickAction {
  label: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatIconModule, MatButtonModule,
    MatRippleModule, MatProgressSpinnerModule
  ],
  templateUrl: './dashboard-component.html',
  styleUrls: ['./dashboard-component.scss']
})
export class DashboardComponent implements OnInit {

  loading      = true;
  greeting     = '';
  currentDate  = new Date();

  // Stats commandes du jour
  pendingOrders   = 0;
  confirmedOrders = 0;
  todayRevenue    = 0;
  activePromos    = 0;

  stats: StatCard[] = [
    { label: 'Produits',      value: '—', icon: 'inventory_2',   color: '#6366f1', accent: '#eef2ff', route: '/products' },
    { label: 'Catégories',    value: '—', icon: 'category',      color: '#10b981', accent: '#ecfdf5', route: '/categories' },
    { label: 'Packs',         value: '—', icon: 'layers',        color: '#f59e0b', accent: '#fffbeb', route: '/packs' },
    { label: 'Menus actifs',  value: '—', icon: 'menu_book',     color: '#3b82f6', accent: '#eff6ff', route: '/menu' },
    { label: 'Commandes',     value: '—', icon: 'receipt_long',  color: '#ec4899', accent: '#fdf2f8', route: '/orders' },
    { label: 'Promotions',    value: '—', icon: 'local_offer',   color: '#ef4444', accent: '#fef2f2', route: '/promotions' },
  ];

  quickActions: QuickAction[] = [
    { label: 'Nouvelle commande', icon: 'add_shopping_cart', route: '/orders/new',    color: '#ec4899' },
    { label: 'Nouveau produit',   icon: 'add_circle',        route: '/products',      color: '#6366f1' },
    { label: 'Nouveau pack',      icon: 'add_box',           route: '/packs',         color: '#f59e0b' },
    { label: 'Nouvelle promo',    icon: 'local_offer',       route: '/promotions',    color: '#ef4444' },
    { label: 'Gérer les tables',  icon: 'table_restaurant',  route: '/tables',        color: '#10b981' },
    { label: 'Voir le menu QR',   icon: 'qr_code_scanner',   route: '/qr-code',       color: '#3b82f6' },
    { label: 'Mon équipe',        icon: 'badge',             route: '/staff',         color: '#8b5cf6' },
    { label: 'Factures',          icon: 'receipt',           route: '/invoices',      color: '#14b8a6' },
  ];

  constructor(
    private productService:  ProductService,
    private categoryService: CategoryService,
    private packService:     PackService,
    private orderService:    OrderService,
    private promotionService: PromotionService,
    private cdr:             ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setGreeting();
    this.loadStats();
  }

  setGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12)      this.greeting = 'Bonjour';
    else if (hour < 18) this.greeting = 'Bon après-midi';
    else                this.greeting = 'Bonsoir';
  }

  loadStats(): void {
    forkJoin({
      products:   this.productService.getAll(1, 1),
      categories: this.categoryService.getAll(),
      packs:      this.packService.getAll(1, 1),
      orders:     this.orderService.getAll().pipe(catchError(() => of([]))),
      promos:     this.promotionService.getActive().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ products, categories, packs, orders, promos }) => {
        this.stats[0].value = products.total;
        this.stats[1].value = categories.length;
        this.stats[2].value = packs.total;

        // Commandes
        const pending   = orders.filter((o: any) => o.status === 'PENDING').length;
        const confirmed = orders.filter((o: any) => o.status === 'CONFIRMED').length;
        const todayPaid = orders.filter((o: any) => o.status === 'PAID');

        this.pendingOrders   = pending;
        this.confirmedOrders = confirmed;
        this.todayRevenue    = todayPaid.reduce((sum: number, o: any) => sum + o.total, 0);

        this.stats[4].value = orders.length;
        if (pending > 0) {
          this.stats[4].badge = `${pending} en attente`;
        }

        // Promos actives
        this.activePromos  = promos.length;
        this.stats[5].value = promos.length;

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }
}
