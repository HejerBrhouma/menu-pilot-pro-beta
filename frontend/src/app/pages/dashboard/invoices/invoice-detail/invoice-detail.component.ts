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
import { EstablishmentService } from '../../../../core/services/establishment.service';
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
  invoice:    Invoice | null = null;
  loading     = true;
  logoUrl:    string | null = null;

  paymentLabels = PAYMENT_METHOD_LABELS;

  private route                = inject(ActivatedRoute);
  private router               = inject(Router);

  get isPosMode(): boolean { return this.router.url.startsWith('/pos'); }
  get backRoute(): string  { return this.isPosMode ? '/pos/invoices' : '/invoices'; }
  private orderService         = inject(OrderService);
  private establishmentService = inject(EstablishmentService);
  private snackBar             = inject(MatSnackBar);
  private cdr                  = inject(ChangeDetectorRef);
  private pdfService           = inject(PdfService);

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
        this.loadEstablishmentLogo();
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Facture introuvable', '✕', { duration: 3000 });
        this.router.navigate([this.backRoute]);
      }
    });
  }

  private loadEstablishmentLogo(): void {
    // Essayer d'abord via le champ logo retourné dans invoice.establishment
    const est = (this.invoice as any)?.establishment;
    if (est?.logo) {
      this.logoUrl = this.establishmentService.getLogoUrl(est.logo);
      this.cdr.detectChanges();
      return;
    }
    // Sinon, charger l'enseigne directement (fiable même sans cache Symfony)
    this.establishmentService.getAll().subscribe({
      next: (ests) => {
        if (ests.length && ests[0].logo) {
          this.logoUrl = this.establishmentService.getLogoUrl(ests[0].logo);
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  printInvoice(): void {
    document.body.classList.add('printing-invoice');
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('printing-invoice');
    }, { once: true });
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
    const est = (this.invoice as any)?.establishment;
    return est?.name || 'Menu Pilot';
  }

  getEstablishmentLogoUrl(): string | null {
    return this.logoUrl;
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
