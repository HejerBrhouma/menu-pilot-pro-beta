// src/app/pages/public/order-confirmed/order-confirmed.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PublicOrderService, PublicOrderStatus } from '../../../core/services/public-order.service';

@Component({
  selector: 'app-order-confirmed',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './order-confirmed.component.html',
  styleUrls: ['./order-confirmed.component.scss']
})
export class OrderConfirmedComponent implements OnInit, OnDestroy {
  orderId     = 0;
  orderNumber = '';
  total       = 0;
  tableName   = '';
  token       = '';

  status:     string = 'PENDING';
  updatedAt:  string = '';
  loading     = false;

  private mercureSource: EventSource | null = null;
  private pollInterval:  any = null;

  private route         = inject(ActivatedRoute);
  private publicService = inject(PublicOrderService);
  private cdr           = inject(ChangeDetectorRef);

  readonly statusConfig: Record<string, { label: string; icon: string; color: string; message: string }> = {
    PENDING:   { label: 'En attente',      icon: 'hourglass_empty', color: '#f59e0b', message: 'Votre commande a été envoyée. Le serveur va la confirmer.' },
    CONFIRMED: { label: 'Confirmée',       icon: 'check_circle',    color: '#6366f1', message: 'Votre commande est confirmée ! La cuisine s\'en occupe.' },
    SERVED:    { label: 'Servie',          icon: 'restaurant',      color: '#10b981', message: 'Votre commande a été servie. Bon appétit !' },
    PAID:      { label: 'Payée',           icon: 'payments',        color: '#059669', message: 'Merci pour votre visite. À bientôt !' },
    CANCELLED: { label: 'Annulée',         icon: 'cancel',          color: '#ef4444', message: 'Votre commande a été annulée. Contactez le serveur.' },
  };

  get currentStatus() {
    return this.statusConfig[this.status] || this.statusConfig['PENDING'];
  }

  get progressSteps() {
    const steps = ['PENDING', 'CONFIRMED', 'SERVED', 'PAID'];
    return steps.map(s => ({
      key:    s,
      label:  this.statusConfig[s].label,
      icon:   this.statusConfig[s].icon,
      done:   steps.indexOf(s) <= steps.indexOf(this.status),
      active: s === this.status,
    }));
  }

  ngOnInit(): void {
    const params    = this.route.snapshot.queryParamMap;
    this.orderId    = Number(params.get('orderId'));
    this.orderNumber = params.get('orderNumber') || '';
    this.total      = Number(params.get('total'));
    this.tableName  = params.get('table') || '';
    this.token      = params.get('token') || '';

    if (this.orderId) {
      this.subscribeToStatus();
      // Polling de secours toutes les 15s si Mercure ne fonctionne pas
      this.pollInterval = setInterval(() => this.refreshStatus(), 15000);
    }
  }

  ngOnDestroy(): void {
    this.mercureSource?.close();
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  subscribeToStatus(): void {
    // Essayer Mercure d'abord
    try {
      const source = this.publicService.subscribeToOrderStatus(this.orderId);
      this.mercureSource = source;
      if (source) {
        source.onmessage = (event: MessageEvent) => {
          const data = JSON.parse(event.data);
          if (data.status) {
            this.status    = data.status;
            this.updatedAt = data.updatedAt || '';
            this.cdr.detectChanges();
          }
        };
        source.onerror = () => {
          if (this.mercureSource) {
            this.mercureSource.close();
            this.mercureSource = null;
          }
        };
      }
    } catch (e) {
      // Mercure non disponible — polling uniquement
    }

    // Charger le statut initial
    this.refreshStatus();
  }

  refreshStatus(): void {
    this.publicService.getOrderStatus(this.orderId).subscribe({
      next: (data: PublicOrderStatus) => {
        this.status    = data.status;
        this.updatedAt = data.updatedAt || '';
        this.cdr.detectChanges();
      }
    });
  }
}
