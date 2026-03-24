// src/app/pages/dashboard/tables/tables.component.ts

import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth-service';
import { RestaurantTable } from '../../../core/models/order.model';
import { TableFormDialogComponent } from './table-form-dialog/table-form-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { TableQrDialogComponent } from './table-qr-dialog/table-qr-dialog.component';

@Component({
  selector: 'app-tables',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterModule,
    MatIconModule, MatButtonModule, MatDialogModule,
    MatSnackBarModule, MatProgressSpinnerModule,
    MatTooltipModule, MatSlideToggleModule
  ],
  templateUrl: 'tables.component.html',
  styleUrls: ['tables.component.scss']
})
export class TablesComponent implements OnInit {
  tables:  RestaurantTable[] = [];
  loading  = true;
  canManage = false;

  private orderService = inject(OrderService);
  private authService  = inject(AuthService);
  private dialog       = inject(MatDialog);
  private snackBar     = inject(MatSnackBar);
  private cdr          = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.canManage = this.authService.canManage();
    this.loadTables();
  }

  loadTables(): void {
    this.loading = true;
    this.orderService.getTables().subscribe({
      next: (tables) => {
        this.tables  = tables.sort((a, b) => a.name.localeCompare(b.name));
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  openAdd(): void {
    const ref = this.dialog.open(TableFormDialogComponent, {
      width: '420px',
      data: { table: null }
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadTables();
    });
  }

  openEdit(table: RestaurantTable): void {
    const ref = this.dialog.open(TableFormDialogComponent, {
      width: '420px',
      data: { table }
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadTables();
    });
  }

  openQr(table: RestaurantTable): void {
    this.dialog.open(TableQrDialogComponent, {
      width: '400px',
      data: { table }
    });
  }

  toggleActive(table: RestaurantTable): void {
    this.orderService.updateTable(table.id!, { isActive: !table.isActive }).subscribe({
      next: () => {
        table.isActive = !table.isActive;
        this.cdr.detectChanges();
        this.notify(table.isActive ? 'Table activée' : 'Table désactivée');
      },
      error: (err: any) => this.notify(err.message, 'error')
    });
  }

  confirmDelete(table: RestaurantTable): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer la table',
        message: `Supprimer <strong>${table.name}</strong> ?`,
        confirmLabel: 'Supprimer',
        confirmColor: 'warn'
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.orderService.deleteTable(table.id!).subscribe({
        next: () => { this.notify('Table supprimée'); this.loadTables(); },
        error: (err: any) => this.notify(err.message, 'error')
      });
    });
  }

  newOrderForTable(table: RestaurantTable): void {
    // Naviguer vers nouvelle commande avec table pré-sélectionnée
    window.location.href = `/orders/new?table=${table.id}`;
  }

  get activeTables(): RestaurantTable[]   { return this.tables.filter(t => t.isActive); }
  get inactiveTables(): RestaurantTable[] { return this.tables.filter(t => !t.isActive); }

  private notify(msg: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(msg, '✕', {
      duration: 3500,
      panelClass: type === 'error' ? ['snack-error'] : ['snack-success'],
      horizontalPosition: 'end', verticalPosition: 'top'
    });
  }
  releaseTable(table: RestaurantTable): void {
    if (!confirm(`Libérer "${table.name}" ? Les commandes QR en attente seront annulées et le QR code sera régénéré.`)) return;

    this.orderService.releaseTable(table.id!).subscribe({
      next: (res) => {
        this.snackBar.open(`Table libérée ✓ — nouveau QR généré`, '✕', {
          duration: 3000, panelClass: ['snack-success']
        });
        this.loadTables(); // recharger les tables
      },
      error: () => {
        this.snackBar.open('Erreur lors de la libération', '✕', { duration: 3000 });
      }
    });
  }
}
