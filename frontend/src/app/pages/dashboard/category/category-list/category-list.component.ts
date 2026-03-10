// src/app/pages/dashboard/category/category-list/category-list.component.ts

import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { CategoryService } from '../../../../core/services/category.service';
import { Category } from '../../../../core/models/category.model';
import { CategoryFormDialogComponent } from '../category-form-dialog/category-form-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatTooltipModule,
    MatSnackBarModule, MatDialogModule, MatProgressSpinnerModule
  ],
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss']
})
export class CategoryListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['name', 'productsCount', 'actions'];
  dataSource = new MatTableDataSource<Category>();

  loading = false;
  searchControl = new FormControl('');

  constructor(
    private categoryService: CategoryService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCategories();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.dataSource.filter = (query ?? '').trim().toLowerCase();
    });
  }

  loadCategories(): void {
    this.loading = true;
    this.categoryService.getAll().subscribe({
      next: (cats) => {
        this.dataSource.data = cats;
        this.loading = false;
        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        });
      },
      error: (err) => {
        this.notify(err.message ?? 'Erreur chargement', 'error');
        this.loading = false;
      }
    });
  }

  openAddDialog(): void {
    const ref = this.dialog.open(CategoryFormDialogComponent, {
      width: '480px',
      data: { category: null }
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.categoryService.create({ name: result.name }).subscribe({
        next: () => { this.notify('Catégorie ajoutée ✓'); this.loadCategories(); },
        error: (err) => this.notify(err.message, 'error')
      });
    });
  }

  openEditDialog(category: Category): void {
    const ref = this.dialog.open(CategoryFormDialogComponent, {
      width: '480px',
      data: { category }
    });
    ref.afterClosed().subscribe(result => {
      if (!result || !category.id) return;
      this.categoryService.update(category.id, { name: result.name }).subscribe({
        next: () => { this.notify('Catégorie mise à jour ✓'); this.loadCategories(); },
        error: (err) => this.notify(err.message, 'error')
      });
    });
  }

  confirmDelete(category: Category): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Supprimer la catégorie',
        message: `Supprimer <strong>${category.name}</strong> ? Les produits associés ne seront pas supprimés.`,
        confirmLabel: 'Supprimer',
        confirmColor: 'warn'
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed || !category.id) return;
      this.categoryService.delete(category.id).subscribe({
        next: () => { this.notify('Catégorie supprimée'); this.loadCategories(); },
        error: (err) => this.notify(err.message, 'error')
      });
    });
  }

  getAvatarColor(name: string): string {
    const colors = [
      '#10b981', '#3f51b5', '#f59e0b', '#ef4444',
      '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
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
