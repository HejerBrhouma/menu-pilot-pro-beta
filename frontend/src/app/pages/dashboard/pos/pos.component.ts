// src/app/pages/dashboard/pos/pos.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { EstablishmentService } from '../../../core/services/establishment.service';
import { TableService } from '../../../core/services/table.service';
import { ReviewService } from '../../../core/services/review.service';
import { AuthService } from '../../../core/services/auth-service';
import { Order } from '../../../core/models/order.model';
import { Invoice } from '../../../core/models/order.model';
import { Table } from '../../../core/models/table.model';

export type PosView = 'home' | 'tables' | 'orders' | 'invoices' | 'reviews';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatTooltipModule, MatSnackBarModule],
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.scss']
})
export class PosComponent implements OnInit, OnDestroy {
  currentView: PosView = 'home';

  // Orders
  pendingOrders: Order[]   = [];
  confirmedOrders: Order[] = [];
  servedOrders: Order[]    = [];
  allActiveOrders: Order[] = [];
  todayRevenue = 0;
  loadingOrders = true;

  // Tables
  tables: Table[]   = [];
  loadingTables = true;

  // Invoices
  invoices: Invoice[]    = [];
  todayInvoices: Invoice[] = [];
  loadingInvoices = true;

  // Reviews
  pendingReviews: any[]      = [];
  loadingReviews             = false;
  moderatingReview: number | null = null;

  establishmentName = '';
  logoUrl: string | null = null;

  private pollTimer: any = null;
  private orderService         = inject(OrderService);
  private establishmentService = inject(EstablishmentService);
  private tableService         = inject(TableService);
  private reviewService        = inject(ReviewService);
  private authService          = inject(AuthService);
  private router               = inject(Router);
  private cdr                  = inject(ChangeDetectorRef);
  private snackBar             = inject(MatSnackBar);

  get canModerateReviews(): boolean {
    const roles = this.authService.getCurrentUser()?.roles ?? [];
    return roles.includes('ROLE_ADMIN') || roles.includes('ROLE_MANAGER');
  }

  ngOnInit(): void {
    this.loadOrders();
    this.loadTables();
    this.loadInvoices();
    if (this.canModerateReviews) {
      this.loadReviews();
    }
    this.pollTimer = setInterval(() => {
      this.loadOrders();
      this.loadTables();
      this.loadInvoices();
      if (this.canModerateReviews) this.loadReviews();
    }, 15000);

    this.establishmentService.getAll().subscribe({
      next: (items) => {
        if (items.length) {
          const est = items[0];
          this.establishmentName = est.name || '';
          if (est.logo) this.logoUrl = this.establishmentService.getLogoUrl(est.logo);
          this.cdr.detectChanges();
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  loadOrders(): void {
    this.loadingOrders = true;
    this.orderService.getAll().subscribe({
      next: (orders) => {
        this.pendingOrders   = orders.filter(o => o.status === 'PENDING');
        this.confirmedOrders = orders.filter(o => o.status === 'CONFIRMED');
        this.servedOrders    = orders.filter(o => o.status === 'SERVED');
        this.allActiveOrders = orders.filter(o => ['PENDING', 'CONFIRMED', 'SERVED'].includes(o.status));
        const today = new Date().toDateString();
        this.todayRevenue = orders
          .filter(o => o.status === 'PAID' && new Date(o.createdAt!).toDateString() === today)
          .reduce((s, o) => s + o.total, 0);
        this.loadingOrders = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loadingOrders = false; this.cdr.detectChanges(); }
    });
  }

  loadTables(): void {
    this.loadingTables = true;
    this.tableService.getAll().subscribe({
      next: (tables) => {
        this.tables = tables.filter(t => t.isActive);
        this.loadingTables = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loadingTables = false; this.cdr.detectChanges(); }
    });
  }

  loadInvoices(): void {
    this.loadingInvoices = true;
    this.orderService.getInvoices().subscribe({
      next: (inv) => {
        const today = new Date().toDateString();
        this.invoices      = inv;
        this.todayInvoices = inv.filter(i => new Date(i.createdAt!).toDateString() === today);
        this.loadingInvoices = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loadingInvoices = false; this.cdr.detectChanges(); }
    });
  }

  loadReviews(): void {
    this.loadingReviews = true;
    this.reviewService.getPendingReviews().subscribe({
      next: (reviews) => {
        this.pendingReviews = reviews;
        this.loadingReviews = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loadingReviews = false; this.cdr.detectChanges(); }
    });
  }

  approveReview(id: number): void {
    this.moderatingReview = id;
    this.reviewService.moderateReview(id, 'approve').subscribe({
      next: () => {
        this.pendingReviews   = this.pendingReviews.filter(r => r.id !== id);
        this.moderatingReview = null;
        this.snackBar.open('Avis approuvé ✓', '✕', { duration: 2500 });
        this.cdr.detectChanges();
      },
      error: () => { this.moderatingReview = null; this.cdr.detectChanges(); }
    });
  }

  rejectReview(id: number): void {
    this.moderatingReview = id;
    this.reviewService.moderateReview(id, 'reject').subscribe({
      next: () => {
        this.pendingReviews   = this.pendingReviews.filter(r => r.id !== id);
        this.moderatingReview = null;
        this.snackBar.open('Avis rejeté', '✕', { duration: 2500 });
        this.cdr.detectChanges();
      },
      error: () => { this.moderatingReview = null; this.cdr.detectChanges(); }
    });
  }

  get freeTables(): number {
    return this.tables.filter(t => t.status === 'FREE').length;
  }

  get occupiedTables(): number {
    return this.tables.filter(t => t.status === 'OCCUPIED').length;
  }

  get todayRevenueStat(): number { return this.todayRevenue; }

  showView(view: PosView): void {
    this.currentView = view;
    if (view === 'reviews' && this.canModerateReviews) {
      this.loadReviews();
    }
  }

  getTableName(order: Order): string {
    if (order.type === 'TAKEAWAY') return 'À emporter';
    const t = order.table as any;
    return t?.name || '—';
  }

  getItemsCount(order: Order): number {
    return order.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  }

  formatTime(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  timeAgo(dateStr?: string): string {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60)  return `il y a ${diff}s`;
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }

  getOrderForTable(table: Table): Order | undefined {
    return this.allActiveOrders.find(o => {
      const t = o.table as any;
      return t?.id === table.id;
    });
  }

  getPaymentLabel(method?: string): string {
    const map: Record<string, string> = {
      CASH: 'Espèces', CARD: 'Carte', CHEQUE: 'Chèque', TRANSFER: 'Virement'
    };
    return method ? (map[method] || method) : '—';
  }

  getReviewTargetIcon(type: string): string {
    const icons: Record<string, string> = {
      ESTABLISHMENT: 'store', PRODUCT: 'inventory_2', PACK: 'layers'
    };
    return icons[type] || 'star';
  }

  getReviewTargetLabel(type: string): string {
    const labels: Record<string, string> = {
      ESTABLISHMENT: 'Enseigne', PRODUCT: 'Produit', PACK: 'Formule'
    };
    return labels[type] || type;
  }

  stars = [1, 2, 3, 4, 5];

  goToOrder(id: number): void {
    this.router.navigate(['/pos/orders', id]);
  }

  goToInvoice(id: number): void {
    this.router.navigate(['/pos/invoices', id]);
  }

  goToNewOrder(): void {
    this.router.navigate(['/pos/orders/new']);
  }

  exitPos(): void {
    this.router.navigate(['/dashboard']);
  }
}
