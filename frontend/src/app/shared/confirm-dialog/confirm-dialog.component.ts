// src/app/shared/confirm-dialog/confirm-dialog.component.ts

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: 'primary' | 'warn' | 'accent';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-wrapper">
      <div class="confirm-icon">
        <mat-icon>warning_amber</mat-icon>
      </div>
      <h2>{{ data.title }}</h2>
      <p [innerHTML]="data.message"></p>
      <div class="confirm-actions">
        <button mat-stroked-button (click)="dialogRef.close(false)">Annuler</button>
        <button mat-flat-button [color]="data.confirmColor || 'warn'" (click)="dialogRef.close(true)">
          {{ data.confirmLabel || 'Confirmer' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-wrapper { padding: 2rem; text-align: center; max-width: 380px; }
    .confirm-icon {
      width: 60px; height: 60px; border-radius: 50%;
      background: #fee2e2; display: flex; align-items: center;
      justify-content: center; margin: 0 auto 1rem;
      mat-icon { color: #dc2626; font-size: 1.75rem; width: 1.75rem; height: 1.75rem; }
    }
    h2 { margin: 0 0 0.5rem; font-size: 1.1rem; font-weight: 700; color: #111827; }
    p { color: #6b7280; font-size: 0.9rem; margin: 0 0 1.5rem; }
    .confirm-actions {
      display: flex; gap: 0.75rem; justify-content: center;
      button { border-radius: 8px; font-weight: 600; }
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}
