// src/app/pages/dashboard/promotions/promotions.component.ts

import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { PromotionService } from '../../../core/services/promotion.service';
import { AuthService } from '../../../core/services/auth-service';
import { Promotion, PromotionConflict } from '../../../core/models/promotion.model';
import { PromotionFormDialogComponent } from './promotion-form-dialog/promotion-form-dialog.component';
import { ConflictResolverDialogComponent } from './conflict-resolver-dialog/conflict-resolver-dialog.component';

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatTableModule,
    MatSlideToggleModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatTooltipModule, MatDialogModule,
    MatChipsModule, MatTabsModule, MatNativeDateModule
  ],
  templateUrl: './promotions.component.html',
  styleUrls: ['./promotions.component.scss']
})
export class PromotionsComponent implements OnInit {
  promotions: Promotion[]         = [];
  conflicts: PromotionConflict[]  = [];
  loading  = true;
  canManage = false;

  displayedColumns = ['name', 'scope', 'type', 'value', 'dates', 'status', 'actions'];

  private promotionService = inject(PromotionService);
  private authService      = inject(AuthService);
  private dialog           = inject(MatDialog);
  private snackBar         = inject(MatSnackBar);
  private cdr              = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.canManage = this.authService.canManage();
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.promotionService.getAll().subscribe({
      next: (promos) => {
        this.promotions = promos;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });

    this.promotionService.getUnresolvedConflicts().subscribe({
      next: (conflicts) => {
        this.conflicts = conflicts;
        this.cdr.detectChanges();
      }
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(PromotionFormDialogComponent, {
      width: '600px',
      data: { promotion: null }
    });
    ref.afterClosed().subscribe(r => { if (r) this.loadData(); });
  }

  openEdit(promo: Promotion): void {
    const ref = this.dialog.open(PromotionFormDialogComponent, {
      width: '600px',
      data: { promotion: promo }
    });
    ref.afterClosed().subscribe(r => { if (r) this.loadData(); });
  }

  openResolveConflict(conflict: PromotionConflict): void {
    const ref = this.dialog.open(ConflictResolverDialogComponent, {
      width: '500px',
      data: { conflict }
    });
    ref.afterClosed().subscribe(r => { if (r) this.loadData(); });
  }

  toggleActive(promo: Promotion): void {
    this.promotionService.update(promo.id!, { isActive: !promo.isActive }).subscribe({
      next: (updated) => {
        const i = this.promotions.findIndex(p => p.id === promo.id);
        if (i !== -1) {
          this.promotions = [
            ...this.promotions.slice(0, i),
            { ...this.promotions[i], isActive: updated.isActive },
            ...this.promotions.slice(i + 1)
          ];
        }
        this.cdr.detectChanges();
        this.notify(updated.isActive ? 'Promo activée ✓' : 'Promo désactivée');
      },
      error: (err: any) => this.notify(err.message, 'error')
    });
  }

  delete(promo: Promotion): void {
    if (!confirm(`Supprimer la promo "${promo.name}" ?`)) return;
    this.promotionService.delete(promo.id!).subscribe({
      next: () => {
        this.promotions = this.promotions.filter(p => p.id !== promo.id);
        this.cdr.detectChanges();
        this.notify('Promo supprimée');
      },
      error: (err: any) => this.notify(err.message, 'error')
    });
  }

  getScopeIcon(scope: string): string {
    const icons: Record<string, string> = {
      PRODUCT: 'inventory_2', CATEGORY: 'category',
      PACK: 'layers', MENU: 'menu_book'
    };
    return icons[scope] || 'label';
  }

  getScopeLabel(scope: string): string {
    const labels: Record<string, string> = {
      PRODUCT: 'Produit', CATEGORY: 'Catégorie',
      PACK: 'Pack', MENU: 'Menu'
    };
    return labels[scope] || scope;
  }

  isActive(promo: Promotion): boolean {
    if (!promo.isActive) return false;
    const now = new Date();
    // startDate et endDate sont optionnels
    if (promo.startDate && new Date(promo.startDate) > now) return false;
    if (promo.endDate   && new Date(promo.endDate)   < now) return false;
    return true;
  }

  getTimeLeft(conflict: PromotionConflict): string {
    const diff = new Date(conflict.autoResolveAt).getTime() - Date.now();
    if (diff <= 0) return 'Expirée';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  }

  private notify(msg: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(msg, '✕', {
      duration: 3500,
      panelClass: type === 'error' ? ['snack-error'] : ['snack-success'],
      horizontalPosition: 'end', verticalPosition: 'top'
    });
  }
}
