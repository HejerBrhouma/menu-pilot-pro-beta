// src/app/pages/dashboard/promotions/conflict-resolver-dialog/conflict-resolver-dialog.component.ts

import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PromotionService } from '../../../../core/services/promotion.service';
import { PromotionConflict } from '../../../../core/models/promotion.model';

@Component({
  selector: 'app-conflict-resolver-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  template: `
    <div class="dialog-header">
      <mat-icon>warning</mat-icon>
      <h2>Conflit de promotions</h2>
    </div>

    <mat-dialog-content>
      <div class="conflict-info">
        <p class="conflict-target">
          <mat-icon>{{ data.conflict.targetType === 'PACK' ? 'layers' : 'inventory_2' }}</mat-icon>
          <strong>{{ data.conflict.targetName }}</strong>
        </p>
        <p class="conflict-desc">
          {{ data.conflict.promotionIds.length }} promotions actives en même temps sur cet élément.
          Choisissez comment les appliquer :
        </p>
      </div>

      <div class="resolution-options">
        <div class="option-card" [class.selected]="selected === 'BEST'" (click)="selected = 'BEST'">
          <div class="option-icon best">
            <mat-icon>star</mat-icon>
          </div>
          <div class="option-info">
            <span class="option-title">Meilleur prix</span>
            <span class="option-desc">Applique la promo qui donne le prix le plus bas</span>
          </div>
          <mat-icon class="check" *ngIf="selected === 'BEST'">check_circle</mat-icon>
        </div>

        <div class="option-card" [class.selected]="selected === 'CUMUL'" (click)="selected = 'CUMUL'">
          <div class="option-icon cumul">
            <mat-icon>add_circle</mat-icon>
          </div>
          <div class="option-info">
            <span class="option-title">Cumul</span>
            <span class="option-desc">Applique toutes les promos en cascade</span>
          </div>
          <mat-icon class="check" *ngIf="selected === 'CUMUL'">check_circle</mat-icon>
        </div>
      </div>

      <div class="auto-resolve-hint">
        <mat-icon>timer</mat-icon>
        <span>Auto-résolution (meilleur prix) dans {{ getTimeLeft() }}</span>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Annuler</button>
      <button mat-flat-button color="primary" (click)="confirm()" [disabled]="!selected || saving">
        <mat-icon>check</mat-icon>
        Confirmer
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header { display:flex; align-items:center; gap:10px; padding:1.5rem 1.5rem 0; }
    .dialog-header mat-icon { color:#f59e0b; font-size:1.75rem; width:1.75rem; height:1.75rem; }
    .dialog-header h2 { margin:0; font-size:1.25rem; font-weight:700; color:#1a1a2e; }
    mat-dialog-content { padding:1.25rem 1.5rem !important; }
    .conflict-target { display:flex; align-items:center; gap:6px; font-size:1rem; color:#1a1a2e; margin:0 0 8px; }
    .conflict-target mat-icon { color:#f59e0b; }
    .conflict-desc { font-size:0.875rem; color:#6b7280; margin:0 0 1.25rem; }
    .resolution-options { display:flex; flex-direction:column; gap:0.75rem; margin-bottom:1rem; }
    .option-card {
      display:flex; align-items:center; gap:1rem; padding:1rem;
      border:2px solid #e5e7eb; border-radius:12px; cursor:pointer; transition:all 0.15s;
      &:hover { border-color:#6366f1; background:#fafafa; }
      &.selected { border-color:#6366f1; background:#eef2ff; }
    }
    .option-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .option-icon.best { background:#fef3c7; mat-icon { color:#f59e0b; } }
    .option-icon.cumul { background:#d1fae5; mat-icon { color:#10b981; } }
    .option-info { flex:1; display:flex; flex-direction:column; }
    .option-title { font-weight:700; font-size:0.9rem; color:#1a1a2e; }
    .option-desc { font-size:0.75rem; color:#6b7280; }
    .check { color:#6366f1; }
    .auto-resolve-hint { display:flex; align-items:center; gap:6px; font-size:0.78rem; color:#9ca3af; padding:0.5rem; background:#f8fafc; border-radius:8px; }
    .auto-resolve-hint mat-icon { font-size:0.9rem; width:0.9rem; height:0.9rem; }
    mat-dialog-actions { padding:1rem 1.5rem !important; gap:0.75rem; }
    mat-dialog-actions button { border-radius:10px; display:flex; align-items:center; gap:6px; }
  `]
})
export class ConflictResolverDialogComponent {
  selected: 'BEST' | 'CUMUL' | null = 'BEST';
  saving = false;

  private promotionService = inject(PromotionService);
  private snackBar         = inject(MatSnackBar);
  dialogRef                = inject(MatDialogRef<ConflictResolverDialogComponent>);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { conflict: PromotionConflict }
  ) {}

  getTimeLeft(): string {
    const diff = new Date(this.data.conflict.autoResolveAt).getTime() - Date.now();
    if (diff <= 0) return 'expiré';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  }

  confirm(): void {
    if (!this.selected) return;
    this.saving = true;
    this.promotionService.resolveConflict(this.data.conflict.id!, this.selected).subscribe({
      next: () => { this.saving = false; this.dialogRef.close(true); },
      error: (err: any) => {
        this.saving = false;
        this.snackBar.open(err.message, '✕', { duration: 4000 });
      }
    });
  }
}
