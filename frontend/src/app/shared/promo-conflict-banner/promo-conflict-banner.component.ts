// src/app/shared/promo-conflict-banner/promo-conflict-banner.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { PromotionService } from '../../core/services/promotion.service';
import { PromotionConflict } from '../../core/models/promotion.model';
import { ConflictResolverDialogComponent } from '../../pages/dashboard/promotions/conflict-resolver-dialog/conflict-resolver-dialog.component';

@Component({
  selector: 'app-promo-conflict-banner',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogModule, RouterModule],
  template: `
    <div class="promo-banner" *ngIf="conflicts.length > 0">
      <div class="banner-left">
        <mat-icon>local_offer</mat-icon>
        <span>
          <strong>{{ conflicts.length }} conflit(s) de promotions</strong>
          nécessitent votre attention
        </span>
      </div>
      <div class="banner-actions">
        <button mat-stroked-button (click)="openFirst()" class="resolve-btn">
          <mat-icon>tune</mat-icon>
          Résoudre
        </button>
        <a routerLink="/promotions" mat-stroked-button class="see-all-btn">
          Voir tout
        </a>
      </div>
    </div>
  `,
  styles: [`
    .promo-banner {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.625rem 1.5rem;
      background: linear-gradient(135deg, #fff7ed, #fef3c7);
      border-bottom: 2px solid #f59e0b;
      animation: slideDown 0.3s ease;
    }
    @keyframes slideDown { from { transform:translateY(-100%); opacity:0; } to { transform:translateY(0); opacity:1; } }
    .banner-left { display:flex; align-items:center; gap:8px; font-size:0.875rem; color:#92400e; }
    .banner-left mat-icon { color:#f59e0b; }
    .banner-actions { display:flex; gap:0.5rem; }
    .resolve-btn { border-color:#f59e0b !important; color:#92400e !important; border-radius:8px; font-size:0.8rem; height:32px; display:flex; align-items:center; gap:4px; }
    .see-all-btn { border-color:#d1d5db !important; color:#6b7280 !important; border-radius:8px; font-size:0.8rem; height:32px; text-decoration:none; display:flex; align-items:center; }
  `]
})
export class PromoConflictBannerComponent implements OnInit {
  conflicts: PromotionConflict[] = [];

  private promotionService = inject(PromotionService);
  private dialog           = inject(MatDialog);

  ngOnInit(): void {
    this.promotionService.getUnresolvedConflicts().subscribe({
      next: (c) => this.conflicts = c,
      error: () => this.conflicts = []
    });
  }

  openFirst(): void {
    if (!this.conflicts.length) return;
    const ref = this.dialog.open(ConflictResolverDialogComponent, {
      width: '500px',
      data: { conflict: this.conflicts[0] }
    });
    ref.afterClosed().subscribe(r => {
      if (r) {
        this.conflicts = this.conflicts.slice(1);
      }
    });
  }
}
