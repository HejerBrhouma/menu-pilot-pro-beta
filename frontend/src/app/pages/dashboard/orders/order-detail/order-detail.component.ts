// src/app/pages/dashboard/orders/order-detail/order-detail.component.ts

import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { OrderService } from '../../../../core/services/order.service';
import { AuthService } from '../../../../core/services/auth-service';
import {
  Order, OrderStatus, Invoice,
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_STATUS_NEXT,
  PAYMENT_METHOD_LABELS
} from '../../../../core/models/order.model';
import { PaymentDialogComponent } from './payment-dialog/payment-dialog.component';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatTooltipModule, MatDividerModule,
    MatDialogModule, MatSelectModule, MatFormFieldModule
  ],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss']
})
export class OrderDetailComponent implements OnInit {
  order:    Order | null = null;
  invoice:  Invoice | null = null;
  loading   = true;
  saving    = false;
  canManage = false;

  statusLabels  = ORDER_STATUS_LABELS;
  statusColors  = ORDER_STATUS_COLORS;
  statusNext    = ORDER_STATUS_NEXT;
  paymentLabels = PAYMENT_METHOD_LABELS;

  // Workflow complet
  readonly workflow: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SERVED', 'PAID'];

  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private orderService = inject(OrderService);
  private authService  = inject(AuthService);
  private snackBar     = inject(MatSnackBar);
  private dialog       = inject(MatDialog);
  private cdr          = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.canManage = this.authService.canManageOrders();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadOrder(id);
  }

  loadOrder(id: number): void {
    this.loading = true;
    this.orderService.getOne(id).subscribe({
      next: (order) => {
        this.order   = order;
        this.loading = false;
        this.cdr.detectChanges();
        // Charger la facture si commande payée
        if (order.status === 'PAID') this.loadInvoice(id);
      },
      error: () => {
        this.loading = false;
        this.notify('Commande introuvable', 'error');
        this.router.navigate(['/orders']);
      }
    });
  }

  loadInvoice(orderId: number): void {
    this.orderService.getInvoices().subscribe({
      next: (invoices) => {
        this.invoice = invoices.find((inv: any) =>
          inv.order?.id === orderId || inv.order === `/api/orders/${orderId}`
        ) || null;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Workflow ──────────────────────────────────────────────────────

  changeStatus(status: OrderStatus): void {
    if (!this.order) return;
    this.saving = true;
    this.orderService.changeStatus(this.order.id!, status).subscribe({
      next: () => {
        this.order = { ...this.order!, status };
        this.saving = false;
        this.notify(`Commande → ${ORDER_STATUS_LABELS[status]}`);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.saving = false;
        this.notify(err.message, 'error');
      }
    });
  }

  openPaymentDialog(): void {
    const ref = this.dialog.open(PaymentDialogComponent, {
      width: '420px',
      data: { order: this.order }
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.saving = true;
      this.orderService.generateInvoice(this.order!.id!, result.paymentMethod).subscribe({
        next: ({ invoiceId }) => {
          this.saving = false;
          this.order  = { ...this.order!, status: 'PAID' };
          this.notify('Facture générée ✓');
          this.loadInvoice(this.order!.id!);
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          this.saving = false;
          this.notify(err.message, 'error');
        }
      });
    });
  }

  cancelOrder(): void {
    if (!this.order) return;
    this.changeStatus('CANCELLED');
  }

  // ── Helpers ───────────────────────────────────────────────────────

  getNextStatus(): OrderStatus | null {
    if (!this.order) return null;
    return (ORDER_STATUS_NEXT as any)[this.order.status] || null;
  }

  getNextLabel(): string {
    const next = this.getNextStatus();
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

  isWorkflowDone(step: OrderStatus): boolean {
    const idx = this.workflow.indexOf(step);
    const cur  = this.workflow.indexOf(this.order?.status as OrderStatus);
    return idx <= cur;
  }

  isWorkflowActive(step: OrderStatus): boolean {
    return this.order?.status === step;
  }

  getTableName(): string {
    if (this.order?.type === 'TAKEAWAY') return 'À emporter';
    const t = this.order?.table as any;
    return t?.name || '—';
  }

  getWaiterName(): string {
    const w = this.order?.waiter as any;
    if (!w) return '—';
    return `${w.firstName || ''} ${w.lastName || ''}`.trim() || w.email || '—';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  printInvoice(): void {
    window.print();
  }

  private notify(msg: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(msg, '✕', {
      duration: 3500,
      panelClass: type === 'error' ? ['snack-error'] : ['snack-success'],
      horizontalPosition: 'end', verticalPosition: 'top'
    });
  }
}
