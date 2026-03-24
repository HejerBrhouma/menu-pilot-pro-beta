// src/app/pages/dashboard/orders/order-detail/payment-dialog/payment-dialog.component.ts

import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Order, PAYMENT_METHOD_LABELS } from '../../../../../core/models/order.model';

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="payment-dialog">
      <div class="pd-header">
        <div class="pd-icon"><mat-icon>point_of_sale</mat-icon></div>
        <div>
          <h2>Encaissement</h2>
          <p>{{ data.order.orderNumber }}</p>
        </div>
      </div>

      <mat-dialog-content>
        <div class="pd-total">
          <span>Montant à encaisser</span>
          <span class="pd-amount">{{ data.order.total | number:'1.2-2' }} TND</span>
        </div>

        <div class="pd-methods">
          <label class="pd-label">Mode de paiement</label>
          <div class="methods-grid">
            <button class="method-btn"
              *ngFor="let m of methods"
              [class.active]="selected === m.value"
              (click)="selected = m.value">
              <mat-icon>{{ m.icon }}</mat-icon>
              <span>{{ m.label }}</span>
            </button>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-stroked-button mat-dialog-close>Annuler</button>
        <button mat-flat-button class="confirm-btn"
          (click)="confirm()" [disabled]="!selected">
          <mat-icon>check_circle</mat-icon>
          Confirmer le paiement
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .payment-dialog { font-family: 'DM Sans', sans-serif; }
    .pd-header {
      display: flex; align-items: center; gap: 1rem; padding: 1.5rem 1.5rem 0;
      .pd-icon {
        width: 48px; height: 48px; border-radius: 14px;
        background: #dcfce7; display: flex; align-items: center; justify-content: center;
        mat-icon { font-size: 1.5rem; width: 1.5rem; height: 1.5rem; color: #10b981; }
      }
      h2 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #1a1a2e; }
      p  { margin: 0; font-size: 0.78rem; color: #9ca3af; }
    }
    mat-dialog-content { padding: 1.25rem 1.5rem !important; }
    .pd-total {
      display: flex; justify-content: space-between; align-items: center;
      background: #f8fafc; border-radius: 12px; padding: 1rem 1.25rem;
      margin-bottom: 1.25rem;
      span:first-child { font-size: 0.875rem; color: #6b7280; }
      .pd-amount { font-size: 1.5rem; font-weight: 800; color: #1a1a2e; }
    }
    .pd-label { font-size: 0.78rem; font-weight: 700; color: #6b7280; text-transform: uppercase;
      letter-spacing: 0.5px; display: block; margin-bottom: 0.75rem; }
    .methods-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.625rem; }
    .method-btn {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 1rem; border-radius: 12px; border: 2px solid #f1f5f9;
      background: white; cursor: pointer; transition: all 0.15s;
      mat-icon { font-size: 1.5rem; width: 1.5rem; height: 1.5rem; color: #6b7280; }
      span { font-size: 0.82rem; font-weight: 600; color: #374151; }
      &:hover { border-color: #6366f1; }
      &.active {
        border-color: #10b981; background: #f0fdf4;
        mat-icon { color: #10b981; }
        span { color: #10b981; }
      }
    }
    mat-dialog-actions { padding: 1rem 1.5rem !important; gap: 0.75rem; }
    mat-dialog-actions button { border-radius: 10px; display: flex; align-items: center; gap: 6px; }
    .confirm-btn { background: #10b981 !important; color: white !important; font-weight: 700; }
  `]
})
export class PaymentDialogComponent {
  selected = 'CASH';

  methods = [
    { value: 'CASH',   label: 'Espèces',        icon: 'payments' },
    { value: 'CARD',   label: 'Carte bancaire',  icon: 'credit_card' },
    { value: 'CHEQUE', label: 'Chèque',          icon: 'receipt_long' },
    { value: 'OTHER',  label: 'Autre',           icon: 'more_horiz' },
  ];

  dialogRef = inject(MatDialogRef<PaymentDialogComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { order: Order }) {}

  confirm(): void {
    this.dialogRef.close({ paymentMethod: this.selected });
  }
}
