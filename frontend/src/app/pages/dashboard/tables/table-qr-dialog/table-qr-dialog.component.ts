// src/app/pages/dashboard/tables/table-qr-dialog/table-qr-dialog.component.ts

import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RestaurantTable } from '../../../../core/models/order.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-table-qr-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatSnackBarModule, MatTooltipModule],
  template: `
    <div class="qr-dialog">

      <!-- Header with close X -->
      <div class="qr-header">
        <div class="qr-header-title">
          <mat-icon>qr_code_2</mat-icon>
          <h2>QR Code — {{ data.table.name }}</h2>
        </div>
        <button mat-icon-button class="close-btn" (click)="dialogRef.close()" matTooltip="Fermer">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <div class="qr-body">

          <div class="table-info">
            <mat-icon>people</mat-icon>
            <span>{{ data.table.capacity }} personnes</span>
          </div>

          <!-- QR Code -->
          <div class="qr-image-wrap">
            <img [src]="qrImageUrl" [alt]="'QR Code ' + data.table.name" class="qr-image">
          </div>

          <!-- URL avec bouton copier -->
          <div class="qr-url-block">
            <span class="qr-url-text">{{ tableUrl }}</span>
            <button class="copy-btn" (click)="copyUrl()" [class.copied]="urlCopied"
                    [matTooltip]="urlCopied ? 'Copié !' : 'Copier le lien'">
              <mat-icon>{{ urlCopied ? 'check' : 'content_copy' }}</mat-icon>
            </button>
          </div>

          <!-- Hint mobile -->
          <div class="mobile-hint">
            <mat-icon>smartphone</mat-icon>
            <span>Scannez depuis un téléphone sur le même réseau WiFi</span>
          </div>

        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-icon-button (click)="download()" matTooltip="Télécharger" class="action-btn">
          <mat-icon>download</mat-icon>
        </button>
        <button mat-icon-button color="primary" (click)="print()" matTooltip="Imprimer" class="action-btn">
          <mat-icon>print</mat-icon>
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .qr-dialog { font-family: 'DM Sans', sans-serif; min-width: 360px; }

    .qr-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1rem 0 1.5rem;
    }
    .qr-header-title {
      display: flex; align-items: center; gap: 10px;
      mat-icon { color: #6366f1; font-size: 1.75rem; width: 1.75rem; height: 1.75rem; }
      h2 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #1a1a2e; }
    }
    .close-btn { color: #9ca3af; &:hover { color: #1a1a2e; } }

    mat-dialog-content {
      padding: 1rem 1.5rem !important;
      max-height: none !important;
      overflow: hidden !important;
    }

    .qr-body {
      display: flex; flex-direction: column; align-items: center; gap: 0.85rem;
    }

    .table-info {
      display: flex; align-items: center; gap: 6px;
      color: #6b7280; font-size: 0.875rem;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
    }

    .qr-image-wrap {
      background: white; padding: 1rem; border-radius: 16px;
      border: 2px solid #f1f5f9; box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    }
    .qr-image { width: 170px; height: 170px; display: block; }

    /* URL + bouton copier */
    .qr-url-block {
      display: flex; align-items: center; gap: 8px;
      background: #f8f9fa; border-radius: 10px; padding: 8px 12px;
      width: 100%; box-sizing: border-box;
    }
    .qr-url-text {
      flex: 1; font-size: 0.72rem; color: #6b7280;
      word-break: break-all; line-height: 1.4;
    }
    .copy-btn {
      display: flex; align-items: center; justify-content: center;
      width: 30px; height: 30px; border-radius: 8px; border: 1.5px solid #e5e7eb;
      background: white; cursor: pointer; color: #6366f1;
      transition: all 0.15s; flex-shrink: 0;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
      &.copied { background: #dcfce7; border-color: #10b981; color: #16a34a; }
      &:hover:not(.copied) { background: #eef2ff; }
    }

    /* Hint mobile */
    .mobile-hint {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.72rem; color: #9ca3af; text-align: center;
      mat-icon { font-size: 0.875rem; width: 0.875rem; height: 0.875rem; flex-shrink: 0; }
    }

    mat-dialog-actions {
      padding: 0.5rem 1rem !important; gap: 4px; border-top: 1px solid #f1f5f9;
    }
    .action-btn { color: #6b7280; &:hover { color: #6366f1; background: #eef2ff; } }
  `]
})
export class TableQrDialogComponent implements OnInit {
  qrImageUrl = '';
  tableUrl   = '';
  urlCopied  = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { table: RestaurantTable },
    public dialogRef: MatDialogRef<TableQrDialogComponent>,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Utiliser l'IP réelle (window.location.hostname) au lieu de localhost
    // Ainsi le QR fonctionne sur mobile sur le même réseau WiFi
    const host     = window.location.hostname;
    const port     = window.location.port ? ':' + window.location.port : '';
    const protocol = window.location.protocol;

    this.tableUrl  = `${protocol}//${host}${port}/table/${this.data.table.qrToken}`;
    const encoded  = encodeURIComponent(this.tableUrl);
    this.qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;
  }

  copyUrl(): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.tableUrl).then(() => {
        this.urlCopied = true;
        setTimeout(() => this.urlCopied = false, 2500);
      }).catch(() => this.copyFallback());
    } else {
      this.copyFallback();
    }
  }

  private copyFallback(): void {
    // Fallback pour les navigateurs sans Clipboard API
    const textarea = document.createElement('textarea');
    textarea.value = this.tableUrl;
    textarea.style.position = 'fixed';
    textarea.style.opacity  = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
      this.urlCopied = true;
      setTimeout(() => this.urlCopied = false, 2500);
    } catch (e) {
      this.snackBar.open('Impossible de copier', '✕', { duration: 2000 });
    }
    document.body.removeChild(textarea);
  }

  print(): void {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>QR - ${this.data.table.name}</title>
      <style>
        body { font-family: sans-serif; text-align: center; padding: 2rem; }
        h1   { font-size: 1.5rem; margin-bottom: 0.5rem; color: #1a1a2e; }
        p    { color: #666; margin-bottom: 1.5rem; }
        img  { width: 250px; height: 250px; }
        .url { font-size: 0.7rem; color: #999; margin-top: 1rem; word-break: break-all; }
      </style></head>
      <body>
        <h1>${this.data.table.name}</h1>
        <p>Scannez pour commander · ${this.data.table.capacity} personnes</p>
        <img src="${this.qrImageUrl}" />
        <p class="url">${this.tableUrl}</p>
        <script>window.onload = () => { window.print(); window.close(); }</script>
      </body></html>
    `);
    win.document.close();
  }

  download(): void {
    const a    = document.createElement('a');
    a.href     = this.qrImageUrl;
    a.download = `qr-${this.data.table.name}.png`;
    a.target   = '_blank';
    a.click();
  }
}
