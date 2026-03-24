// src/app/core/services/admin-notification.service.ts
// Notification sonore admin pour nouvelles commandes QR

import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class AdminNotificationService {
  private snackBar = inject(MatSnackBar);

  // Son d'alerte pour nouvelle commande QR
  playNewQrOrderSound(): void {
    try {
      const ctx  = new (window.AudioContext || (window as any).webkitAudioContext)();
      const times = [0, 0.15, 0.3];

      times.forEach(t => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime + t);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.12);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.12);
      });
    } catch (e) {}
  }

  // Toast notification avec son
  notifyNewQrOrder(orderNumber: string, tableName: string, customerName?: string): void {
    this.playNewQrOrderSound();
    const customer = customerName ? ` — ${customerName}` : '';
    this.snackBar.open(
      `🔔 Nouvelle commande QR · ${tableName}${customer} · ${orderNumber}`,
      'Voir',
      {
        duration: 8000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['snack-qr-order']
      }
    );
  }
}
