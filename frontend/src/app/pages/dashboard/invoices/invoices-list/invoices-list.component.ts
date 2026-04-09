// src/app/pages/dashboard/invoices/invoices-list/invoices-list.component.ts

import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OrderService } from '../../../../core/services/order.service';
import { Invoice, PAYMENT_METHOD_LABELS } from '../../../../core/models/order.model';

@Component({
  selector: 'app-invoices-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule
  ],
  templateUrl: './invoices-list.component.html',
  styleUrls: ['./invoices-list.component.scss']
})
export class InvoicesListComponent implements OnInit {
  allInvoices:  Invoice[] = [];
  loading       = true;
  searchQuery   = '';
  activeFilter  = 'ALL';

  dateFrom      = '';
  dateTo        = '';
  activePeriod  = '';

  paymentLabels = PAYMENT_METHOD_LABELS;

  private orderService = inject(OrderService);
  private snackBar     = inject(MatSnackBar);
  private cdr          = inject(ChangeDetectorRef);
  private router       = inject(Router);

  get isPosMode(): boolean { return this.router.url.startsWith('/pos'); }
  get invoiceBasePath(): string { return this.isPosMode ? '/pos/invoices' : '/invoices'; }

  get filters() {
    return [
      { key: 'ALL',    label: 'Toutes',   count: this.allInvoices.length },
      { key: 'CASH',   label: 'Espèces',  count: this.countByMethod('CASH') },
      { key: 'CARD',   label: 'Carte',    count: this.countByMethod('CARD') },
      { key: 'CHEQUE', label: 'Chèque',   count: this.countByMethod('CHEQUE') },
      { key: 'OTHER',  label: 'Autre',    count: this.countByMethod('OTHER') },
    ];
  }

  get filtered(): Invoice[] {
    let list = this.allInvoices;

    if (this.activeFilter !== 'ALL') {
      list = list.filter(i => i.paymentMethod === this.activeFilter);
    }

    if (this.dateFrom) {
      const from = new Date(this.dateFrom);
      from.setHours(0, 0, 0, 0);
      list = list.filter(i => new Date(i.createdAt!) >= from);
    }
    if (this.dateTo) {
      const to = new Date(this.dateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter(i => new Date(i.createdAt!) <= to);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(i =>
        (i.invoiceNumber || '').toLowerCase().includes(q) ||
        ((i.order as any)?.orderNumber || '').toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) =>
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  get totalRevenue(): number {
    return Math.round(this.allInvoices.reduce((s, i) => s + i.total, 0) * 100) / 100;
  }

  get todayRevenue(): number {
    const today = new Date().toDateString();
    return Math.round(this.allInvoices
      .filter(i => new Date(i.createdAt!).toDateString() === today)
      .reduce((s, i) => s + i.total, 0) * 100) / 100;
  }

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading = true;
    this.orderService.getInvoices().subscribe({
      next: (invoices) => {
        this.allInvoices = invoices;
        this.loading     = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  setPeriod(period: 'today' | 'week' | 'month' | ''): void {
    this.activePeriod = period;
    const today = new Date();
    const toStr = today.toISOString().slice(0, 10);
    if (period === 'today') {
      this.dateFrom = toStr;
      this.dateTo   = toStr;
    } else if (period === 'week') {
      const start = new Date(today);
      const day = today.getDay() || 7;
      start.setDate(today.getDate() - day + 1);
      this.dateFrom = start.toISOString().slice(0, 10);
      this.dateTo   = toStr;
    } else if (period === 'month') {
      this.dateFrom = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
      this.dateTo   = toStr;
    } else {
      this.dateFrom = '';
      this.dateTo   = '';
    }
  }

  clearDateFilter(): void {
    this.dateFrom     = '';
    this.dateTo       = '';
    this.activePeriod = '';
  }

  countByMethod(method: string): number {
    return this.allInvoices.filter(i => i.paymentMethod === method).length;
  }

  getPaymentIcon(method?: string): string {
    const icons: Record<string, string> = {
      CASH:   'payments',
      CARD:   'credit_card',
      CHEQUE: 'receipt_long',
      OTHER:  'more_horiz'
    };
    return method ? (icons[method] || 'payments') : 'payments';
  }

  getOrderNumber(invoice: Invoice): string {
    const o = invoice.order as any;
    return o ? (o.orderNumber || '—') : '—';
  }

  getWaiterName(invoice: Invoice): string {
    const w = invoice.waiter as any;
    if (!w) return '—';
    return ((w.firstName || '') + ' ' + (w.lastName || '')).trim() || w.email || '—';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
