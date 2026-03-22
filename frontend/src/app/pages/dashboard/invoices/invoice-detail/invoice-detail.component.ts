// src/app/pages/dashboard/invoices/invoice-detail/invoice-detail.component.ts

import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { OrderService } from '../../../../core/services/order.service';
import { Invoice, PAYMENT_METHOD_LABELS } from '../../../../core/models/order.model';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatTooltipModule, MatDividerModule
  ],
  templateUrl: './invoice-detail.component.html',
  styleUrls: ['./invoice-detail.component.scss']
})
export class InvoiceDetailComponent implements OnInit {
  invoice:  Invoice | null = null;
  loading   = true;

  paymentLabels = PAYMENT_METHOD_LABELS;

  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private orderService = inject(OrderService);
  private snackBar     = inject(MatSnackBar);
  private cdr          = inject(ChangeDetectorRef);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadInvoice(id);
  }

  loadInvoice(id: number): void {
    this.loading = true;
    this.orderService.getInvoice(id).subscribe({
      next: (invoice) => {
        this.invoice = invoice;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Facture introuvable', '✕', { duration: 3000 });
        this.router.navigate(['/invoices']);
      }
    });
  }

  // ── PDF Print ──────────────────────────────────────────────────────

  printInvoice(): void {
    window.print();
  }

  downloadPdf(): void {
    // Utilise window.print() avec CSS @media print pour générer le PDF
    const originalTitle = document.title;
    document.title = `Facture-${this.invoice?.invoiceNumber}`;
    window.print();
    document.title = originalTitle;
  }

  // ── Helpers ────────────────────────────────────────────────────────

  getOrderNumber(): string {
    const o = this.invoice?.order as any;
    return o?.orderNumber || '—';
  }

  getOrderId(): number | null {
    const o = this.invoice?.order as any;
    return o?.id || null;
  }

  getWaiterName(): string {
    const w = this.invoice?.waiter as any;
    if (!w) return '—';
    return `${w.firstName || ''} ${w.lastName || ''}`.trim() || w.email || '—';
  }

  getTableName(): string {
    const o = this.invoice?.order as any;
    if (!o) return '—';
    if (o.type === 'TAKEAWAY') return 'À emporter';
    const t = o.table as any;
    return t?.name || '—';
  }

  getEstablishmentName(): string {
    const e = this.invoice?.establishment as any;
    return e?.name || 'Menu Pilot';
  }

  getPaymentIcon(method?: string): string {
    const icons: Record<string, string> = {
      CASH: 'payments', CARD: 'credit_card',
      CHEQUE: 'receipt_long', OTHER: 'more_horiz'
    };
    return icons[method || ''] || 'payments';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  formatDateShort(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }
}
