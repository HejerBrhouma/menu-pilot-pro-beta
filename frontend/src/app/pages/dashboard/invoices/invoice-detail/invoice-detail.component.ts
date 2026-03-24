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
import { PdfService } from '../../../../core/services/pdf.service';
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
  invoice: Invoice | null = null;
  loading  = true;

  paymentLabels = PAYMENT_METHOD_LABELS;

  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private orderService = inject(OrderService);
  private snackBar     = inject(MatSnackBar);
  private cdr          = inject(ChangeDetectorRef);
  private pdfService   = inject(PdfService);

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

  printInvoice(): void {
    window.print();
  }

  async downloadPdf(): Promise<void> {
    if (!this.invoice) return;
    const filename = 'Facture-' + this.invoice.invoiceNumber;
    await this.pdfService.downloadInvoice('invoice-print', filename);
  }

  getOrderNumber(): string {
    const o = this.invoice ? (this.invoice.order as any) : null;
    return o ? (o.orderNumber || '—') : '—';
  }

  getOrderId(): number | null {
    const o = this.invoice ? (this.invoice.order as any) : null;
    return o ? (o.id || null) : null;
  }

  getWaiterName(): string {
    const w = this.invoice ? (this.invoice.waiter as any) : null;
    if (!w) return '—';
    const name = ((w.firstName || '') + ' ' + (w.lastName || '')).trim();
    return name || w.email || '—';
  }

  getTableName(): string {
    const o = this.invoice ? (this.invoice.order as any) : null;
    if (!o) return '—';
    if (o.type === 'TAKEAWAY') return 'À emporter';
    const t = o.table as any;
    return t ? (t.name || '—') : '—';
  }

  getEstablishmentName(): string {
    const inv = this.invoice as any;
    if (!inv || !inv.establishment) return 'Menu Pilot';
    return inv.establishment.name || 'Menu Pilot';
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
