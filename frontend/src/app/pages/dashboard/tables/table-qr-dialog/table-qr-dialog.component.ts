// src/app/pages/dashboard/tables/table-qr-dialog/table-qr-dialog.component.ts

import { Component, OnInit, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RestaurantTable } from '../../../../core/models/order.model';

@Component({
  selector: 'app-table-qr-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="qr-dialog">
      <div class="qr-header">
        <mat-icon>qr_code_2</mat-icon>
        <h2>QR Code — {{ data.table.name }}</h2>
      </div>

      <mat-dialog-content>
        <div class="qr-body">

          <div class="table-info">
            <span><mat-icon>people</mat-icon> {{ data.table.capacity }} personnes</span>
          </div>

          <!-- QR Code affiché via API Google Charts -->
          <div class="qr-image-wrap">
            <img [src]="qrUrl" [alt]="'QR Code ' + data.table.name" class="qr-image">
          </div>

          <div class="qr-token">
            <mat-icon>token</mat-icon>
            <span>{{ data.table.qrToken }}</span>
          </div>

          <div class="qr-url">
            <mat-icon>link</mat-icon>
            <span>{{ tableUrl }}</span>
          </div>

        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="center">
        <button mat-stroked-button mat-dialog-close>Fermer</button>
        <button mat-flat-button color="primary" (click)="print()">
          <mat-icon>print</mat-icon> Imprimer
        </button>
        <button mat-flat-button (click)="download()">
          <mat-icon>download</mat-icon> Télécharger
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .qr-dialog { font-family: 'DM Sans', sans-serif; }
    .qr-header { display:flex; align-items:center; gap:10px; padding:1.5rem 1.5rem 0; }
    .qr-header mat-icon { color:#6366f1; font-size:1.75rem; width:1.75rem; height:1.75rem; }
    .qr-header h2 { margin:0; font-size:1.1rem; font-weight:700; }
    mat-dialog-content { padding:1.25rem 1.5rem !important; }
    .qr-body { display:flex; flex-direction:column; align-items:center; gap:1rem; }
    .table-info { display:flex; align-items:center; gap:6px; color:#6b7280; font-size:0.875rem; }
    .table-info mat-icon { font-size:1rem; width:1rem; height:1rem; }
    .qr-image-wrap {
      background: white; padding: 1rem; border-radius: 16px;
      border: 2px solid #f1f5f9; box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    }
    .qr-image { width:200px; height:200px; display:block; }
    .qr-token, .qr-url {
      display:flex; align-items:center; gap:6px;
      font-size:0.72rem; color:#9ca3af; word-break:break-all; text-align:center;
      mat-icon { font-size:0.875rem; width:0.875rem; height:0.875rem; flex-shrink:0; }
    }
    mat-dialog-actions { padding:1rem 1.5rem !important; gap:0.75rem; justify-content:center !important; }
    mat-dialog-actions button { border-radius:10px; display:flex; align-items:center; gap:6px; }
  `]
})
export class TableQrDialogComponent implements OnInit {
  qrUrl    = '';
  tableUrl = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: { table: RestaurantTable }) {}

  ngOnInit(): void {
    this.tableUrl = `${window.location.origin}/table/${this.data.table.qrToken}`;
    const encoded = encodeURIComponent(this.tableUrl);
    this.qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;
  }

  print(): void {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>QR - ${this.data.table.name}</title>
      <style>
        body { font-family: sans-serif; text-align: center; padding: 2rem; }
        h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
        p { color: #666; margin-bottom: 1.5rem; }
        img { width: 250px; height: 250px; }
      </style></head>
      <body>
        <h1>${this.data.table.name}</h1>
        <p>Scannez pour commander · ${this.data.table.capacity} personnes</p>
        <img src="${this.qrUrl}" />
        <p style="font-size:0.75rem;color:#999;margin-top:1rem">${this.tableUrl}</p>
      </body></html>
    `);
    win.document.close();
    win.print();
  }

  download(): void {
    const a  = document.createElement('a');
    a.href   = this.qrUrl;
    a.download = `qr-${this.data.table.name}.png`;
    a.click();
  }
}
