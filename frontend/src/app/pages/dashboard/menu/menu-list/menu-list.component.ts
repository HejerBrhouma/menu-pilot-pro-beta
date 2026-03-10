// src/app/pages/dashboard/menu/menu-list/menu-list.component.ts

import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { MenuService } from '../../../../core/services/menu.service';
import { MenuRead } from '../../../../core/models/menu.model';
import { MenuFormDialogComponent } from '../menu-form-dialog/menu-form-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { ProductService } from '../../../../core/services/product.service';
import { CategoryService } from '../../../../core/services/category.service';
import { PackService } from '../../../../core/services/pack.service';

@Component({
  selector: 'app-menu-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatTooltipModule, MatChipsModule,
    MatSnackBarModule, MatDialogModule, MatProgressSpinnerModule,
    MatSlideToggleModule
  ],
  templateUrl: './menu-list.component.html',
  styleUrls: ['./menu-list.component.scss']
})
export class MenuListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['name', 'sections', 'horaires', 'status', 'actions'];
  dataSource = new MatTableDataSource<MenuRead>();

  loading = false;
  totalItems = 0;
  currentPage = 1;
  pageSize = 10;
  searchControl = new FormControl('');

  // Données pour le dialog
  allProducts: any[] = [];
  allPacks: any[] = [];
  allCategories: any[] = [];

  constructor(
    private menuService: MenuService,
    private productService: ProductService,
    private packService: PackService,
    private categoryService: CategoryService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadReferenceData();
    this.loadMenus();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(q => {
      this.dataSource.filter = (q ?? '').trim().toLowerCase();
    });
  }

  loadReferenceData(): void {
    this.productService.getAll(1, 100).subscribe({ next: ({ items }) => this.allProducts = items });
    this.packService.getAll(1, 100).subscribe({ next: ({ items }) => this.allPacks = items });
    this.categoryService.getAll().subscribe({ next: cats => this.allCategories = cats });
  }

  loadMenus(): void {
    this.loading = true;
    this.menuService.getAll(this.currentPage, this.pageSize).subscribe({
      next: ({ items, total }) => {
        this.dataSource.data = items;
        this.totalItems = total;
        this.loading = false;
        setTimeout(() => { this.dataSource.sort = this.sort; });
      },
      error: (err) => { this.notify(err.message, 'error'); this.loading = false; }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadMenus();
  }

  openAddDialog(): void {
    const ref = this.dialog.open(MenuFormDialogComponent, {
      width: '750px',
      maxHeight: '90vh',
      data: { menu: null, products: this.allProducts, packs: this.allPacks, categories: this.allCategories }
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.menuService.create(result).subscribe({
        next: () => { this.notify('Menu créé ✓'); this.loadMenus(); },
        error: (err) => this.notify(err.message, 'error')
      });
    });
  }

  openEditDialog(menu: MenuRead): void {
    const ref = this.dialog.open(MenuFormDialogComponent, {
      width: '750px',
      maxHeight: '90vh',
      data: { menu, products: this.allProducts, packs: this.allPacks, categories: this.allCategories }
    });
    ref.afterClosed().subscribe(result => {
      if (!result || !menu.id) return;
      this.menuService.update(menu.id, result).subscribe({
        next: () => { this.notify('Menu mis à jour ✓'); this.loadMenus(); },
        error: (err) => this.notify(err.message, 'error')
      });
    });
  }

  toggleActive(menu: MenuRead): void {
    if (!menu.id) return;
    this.menuService.toggleActive(menu.id, !menu.isActive).subscribe({
      next: () => { this.notify(menu.isActive ? 'Menu désactivé' : 'Menu activé ✓'); this.loadMenus(); },
      error: (err) => this.notify(err.message, 'error')
    });
  }

  confirmDelete(menu: MenuRead): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Supprimer le menu',
        message: `Supprimer le menu <strong>${menu.name}</strong> et toutes ses sections ?`,
        confirmLabel: 'Supprimer',
        confirmColor: 'warn'
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed || !menu.id) return;
      this.menuService.delete(menu.id).subscribe({
        next: () => { this.notify('Menu supprimé'); this.loadMenus(); },
        error: (err) => this.notify(err.message, 'error')
      });
    });
  }

  getQrUrl(menu: MenuRead): string {
    return `${window.location.origin}/menu/${menu.qrToken}`;
  }

  copyQrLink(menu: MenuRead): void {
    navigator.clipboard.writeText(this.getQrUrl(menu));
    this.notify('Lien QR copié ✓');
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
