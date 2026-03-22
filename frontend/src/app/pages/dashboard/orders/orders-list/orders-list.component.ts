// src/app/pages/dashboard/orders/orders-list/orders-list.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { OrderService } from '../../../../core/services/order.service';
import { AuthService } from '../../../../core/services/auth-service';
import { EstablishmentService } from '../../../../core/services/establishment.service';
import {
  Order, OrderStatus,
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_STATUS_NEXT
} from '../../../../core/models/order.model';

interface StatusTab {
  key: string;
  label: string;
  count: number;
  color: string;
}

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    MatTooltipModule, MatMenuModule, MatBadgeModule, MatDividerModule
  ],
  templateUrl: './orders-list.component.html',
  styleUrls: ['./orders-list.component.scss']
})
export class OrdersListComponent implements OnInit, OnDestroy {
  allOrders:     Order[] = [];
  loading        = true;
  activeTab      = 'ALL';
  searchQuery    = '';
  newOrdersCount = 0;

  statusLabels = ORDER_STATUS_LABELS;
  statusColors = ORDER_STATUS_COLORS;
  statusNext   = ORDER_STATUS_NEXT;

  private mercureSource:       EventSource | null = null;
  private orderService         = inject(OrderService);
  private authService          = inject(AuthService);
  private establishmentService = inject(EstablishmentService);
  private snackBar             = inject(MatSnackBar);
  private cdr                  = inject(ChangeDetectorRef);

  // ── Tabs ──────────────────────────────────────────────────────────

  get tabs(): StatusTab[] {
    return [
      { key: 'ALL',       label: 'Toutes',     count: this.allOrders.length,                                    color: '#6b7280' },
      { key: 'PENDING',   label: 'En attente', count: this.countByStatus('PENDING'),   color: '#f59e0b' },
      { key: 'CONFIRMED', label: 'Confirmées', count: this.countByStatus('CONFIRMED'), color: '#6366f1' },
      { key: 'SERVED',    label: 'Servies',    count: this.countByStatus('SERVED'),    color: '#10b981' },
      { key: 'PAID',      label: 'Payées',     count: this.countByStatus('PAID'),      color: '#059669' },
      { key: 'CANCELLED', label: 'Annulées',   count: this.countByStatus('CANCELLED'), color: '#ef4444' },
    ];
  }

  get filteredOrders(): Order[] {
    let orders = this.activeTab === 'ALL'
      ? this.allOrders
      : this.allOrders.filter(o => o.status === this.activeTab);

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      orders = orders.filter(o =>
        o.orderNumber?.toLowerCase().includes(q) ||
        (o.table as any)?.name?.toLowerCase().includes(q) ||
        o.waiter?.firstName?.toLowerCase().includes(q)
      );
    }

    return orders.sort((a, b) =>
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  // Totaux
  get todayRevenue(): number {
    const today = new Date().toDateString();
    return this.allOrders
      .filter(o => o.status === 'PAID' && new Date(o.createdAt!).toDateString() === today)
      .reduce((sum, o) => sum + o.total, 0);
  }

  get pendingCount(): number { return this.countByStatus('PENDING'); }

  // ── Lifecycle ──────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadOrders();
    this.subscribeMercure();
  }

  ngOnDestroy(): void {
    this.mercureSource?.close();
  }

  // ── Data ───────────────────────────────────────────────────────────

  loadOrders(): void {
    this.loading = true;
    this.orderService.getAll().subscribe({
      next: (orders) => {
        this.allOrders = orders;
        this.loading   = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  // ── Mercure ────────────────────────────────────────────────────────

  subscribeMercure(): void {
    this.establishmentService.getAll().subscribe({
      next: (ests) => {
        if (!ests.length) return;
        this.mercureSource = this.orderService.subscribeToOrders(ests[0].id!);
        this.mercureSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.event === 'NEW_ORDER') {
            this.newOrdersCount++;
            this.notify(`🔔 Nouvelle commande ${data.orderNumber}`, 'success');
          }
          this.loadOrders();
        };
      }
    });
  }

  // ── Actions ────────────────────────────────────────────────────────

  changeStatus(order: Order, status: OrderStatus, event: Event): void {
    event.stopPropagation();
    this.orderService.changeStatus(order.id!, status).subscribe({
      next: () => {
        const i = this.allOrders.findIndex(o => o.id === order.id);
        if (i !== -1) {
          this.allOrders = [
            ...this.allOrders.slice(0, i),
            { ...this.allOrders[i], status },
            ...this.allOrders.slice(i + 1)
          ];
          this.cdr.detectChanges();
        }
        this.notify(`Commande → ${ORDER_STATUS_LABELS[status]}`);
      },
      error: (err: any) => this.notify(err.message, 'error')
    });
  }

  cancelOrder(order: Order, event: Event): void {
    event.stopPropagation();
    this.changeStatus(order, 'CANCELLED', event);
  }

  // ── Helpers ────────────────────────────────────────────────────────

  countByStatus(status: string): number {
    return this.allOrders.filter(o => o.status === status).length;
  }

  getNextStatus(status: string): OrderStatus | null {
    return (ORDER_STATUS_NEXT as any)[status] || null;
  }

  getNextLabel(status: string): string {
    const next = this.getNextStatus(status);
    return next ? ORDER_STATUS_LABELS[next] : '';
  }

  getStatusColor(status: string): string {
    return (ORDER_STATUS_COLORS as any)[status] || '#9ca3af';
  }

  getStatusLabel(status: string): string {
    return (ORDER_STATUS_LABELS as any)[status] || status;
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      PENDING:   'hourglass_empty',
      CONFIRMED: 'check_circle',
      SERVED:    'restaurant',
      PAID:      'payments',
      CANCELLED: 'cancel',
    };
    return icons[status] || 'circle';
  }

  getItemsCount(order: Order): number {
    return order.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  }

  getTableName(order: Order): string {
    if (order.type === 'TAKEAWAY') return 'À emporter';
    const t = order.table as any;
    return t?.name || '—';
  }

  getWaiterName(order: Order): string {
    const w = order.waiter as any;
    if (!w) return '—';
    return `${w.firstName || ''} ${w.lastName || ''}`.trim() || w.email || '—';
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Aujourd\'hui';
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Hier';
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }

  isNewOrder(order: Order): boolean {
    const diff = (Date.now() - new Date(order.createdAt!).getTime()) / 60000;
    return diff < 10 && order.status === 'PENDING';
  }

  private notify(msg: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(msg, '✕', {
      duration: 3500,
      panelClass: type === 'error' ? ['snack-error'] : ['snack-success'],
      horizontalPosition: 'end', verticalPosition: 'top'
    });
  }
}
