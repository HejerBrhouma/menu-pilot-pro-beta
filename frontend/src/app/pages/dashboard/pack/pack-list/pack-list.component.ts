// src/app/pages/dashboard/pack/pack-list/pack-list.component.ts

import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { PackService } from '../../../../core/services/pack.service';
import { ProductService } from '../../../../core/services/product.service';
import { PackRead } from '../../../../core/models/pack.model';
import { ProductRead } from '../../../../core/models/product.model';
import { PackFormDialogComponent } from '../pack-form-dialog/pack-form-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-pack-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatChipsModule, MatTooltipModule,
    MatSnackBarModule, MatDialogModule, MatProgressSpinnerModule,
    MatBadgeModule, MatSlideToggleModule
  ],
  templateUrl: './pack-list.component.html',
  styleUrls: ['./pack-list.component.scss']
})
export class PackListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['name', 'products', 'price', 'stock', 'status', 'actions'];
  dataSource = new MatTableDataSource<PackRead>();

  allProducts: ProductRead[] = [];
  loading = false;
  totalItems = 0;
  currentPage = 1;
  pageSize = 10;

  searchControl = new FormControl('');

  constructor(
    private packService: PackService,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadPacks();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.dataSource.filter = (query ?? '').trim().toLowerCase();
    });
  }

  loadProducts(): void {
    this.productService.getAll(1, 100).subscribe({
      next: ({ items }) => this.allProducts = items,
      error: () => this.notify('Erreur chargement produits', 'error')
    });
  }

  loadPacks(): void {
    this.loading = true;
    this.packService.getAll(this.currentPage, this.pageSize).subscribe({
      next: ({ items, total }) => {
        this.dataSource.data = items;
        this.totalItems = total;
        this.loading = false;
        setTimeout(() => { this.dataSource.sort = this.sort; });
      },
      error: (err) => {
        this.notify(err.message, 'error');
        this.loading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadPacks();
  }

  openAddDialog(): void {
    const ref = this.dialog.open(PackFormDialogComponent, {
      width: '650px',
      data: { pack: null, products: this.allProducts }
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.packService.create(result).subscribe({
        next: () => { this.notify('Pack créé ✓'); this.loadPacks(); },
        error: (err) => this.notify(err.message, 'error')
      });
    });
  }

  openEditDialog(pack: PackRead): void {
    const ref = this.dialog.open(PackFormDialogComponent, {
      width: '650px',
      data: { pack, products: this.allProducts }
    });
    ref.afterClosed().subscribe(result => {
      if (!result || !pack.id) return;
      this.packService.update(pack.id, result).subscribe({
        next: () => { this.notify('Pack mis à jour ✓'); this.loadPacks(); },
        error: (err) => this.notify(err.message, 'error')
      });
    });
  }

  toggleActive(pack: PackRead): void {
    if (!pack.id) return;
    this.packService.update(pack.id, { isActive: !pack.isActive }).subscribe({
      next: () => {
        this.notify(pack.isActive ? 'Pack désactivé' : 'Pack activé ✓');
        this.loadPacks();
      },
      error: (err) => this.notify(err.message, 'error')
    });
  }

  confirmDelete(pack: PackRead): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Supprimer le pack',
        message: `Supprimer le pack <strong>${pack.name}</strong> ?`,
        confirmLabel: 'Supprimer',
        confirmColor: 'warn'
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed || !pack.id) return;
      this.packService.delete(pack.id).subscribe({
        next: () => { this.notify('Pack supprimé'); this.loadPacks(); },
        error: (err) => this.notify(err.message, 'error')
      });
    });
  }

  getProductNames(pack: PackRead): string[] {
    return pack.products?.map((p: any) => {
      if (typeof p === 'string') {
        // p is an IRI like "/api/products/5"
        return this.allProducts.find(ap => ap['@id'] === p)?.name
          ?? p.split('/').pop()
          ?? '—';
      }
      // p is an embedded object — use name directly, or look up by @id
      return p.name
        ?? this.allProducts.find(ap => ap['@id'] === p['@id'])?.name
        ?? '—';
    }) ?? [];
  }

  private notify(message: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(message, '✕', {
      duration: 3500,
      panelClass: type === 'error' ? ['snack-error'] : ['snack-success'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}
