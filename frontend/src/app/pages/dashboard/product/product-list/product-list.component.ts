// src/app/pages/dashboard/product/product-list/product-list.component.ts

import {Component, OnInit, ViewChild, ChangeDetectorRef, inject} from '@angular/core';
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
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ProductService } from '../../../../core/services/product.service';
import { CategoryService } from '../../../../core/services/category.service';
import { ProductRead } from '../../../../core/models/product.model';
import { Category } from '../../../../core/models/category.model';
import { ProductFormDialogComponent } from '../product-form-dialog/product-form-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { ProductImageService } from '../../../../core/services/product-image.service';
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatChipsModule, MatTooltipModule,
    MatSnackBarModule, MatDialogModule, MatProgressSpinnerModule
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['name', 'price', 'categories', 'stock', 'status', 'actions'];
  dataSource = new MatTableDataSource<ProductRead>();

  categories: Category[] = [];
  loading = false;
  totalItems = 0;
  currentPage = 1;
  pageSize = 10;
  private imageService = inject(ProductImageService);
  searchControl = new FormControl('');
  private dialogOpen = false;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.dataSource.filter = (query ?? '').trim().toLowerCase();
    });
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: cats => {
        this.categories = cats;
        this.cdr.detectChanges();
      },
      error: () => this.notify('Erreur chargement catégories', 'error')
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getAll(this.currentPage, this.pageSize).subscribe({
      next: ({ items, total }) => {
        this.dataSource.data = items;
        this.totalItems = total;
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.dataSource.sort = this.sort;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.notify(err.message, 'error');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadProducts();
  }

  openAddDialog(): void {
    if (this.dialogOpen) return;
    this.dialogOpen = true;

    const ref = this.dialog.open(ProductFormDialogComponent, {
      width: '600px',
      data: { product: null, categories: this.categories }
    });

    ref.afterClosed().subscribe(result => {
      this.dialogOpen = false;
      if (!result) return;
      const { _pendingImageFile, _removeImage, ...productData } = result;
      this.productService.create(productData).subscribe({
        next: (created: any) => {
          // Upload image si fichier en attente
          if (_pendingImageFile && created.id) {
            this.imageService.uploadImage(created.id, _pendingImageFile).subscribe({
              next: () => { this.notify('Produit ajouté ✓'); this.loadProducts(); },
              error: () => { this.notify('Produit créé mais erreur image', 'error'); this.loadProducts(); }
            });
          } else {
            this.notify('Produit ajouté ✓');
            this.loadProducts();
          }
        },
        error: (err: any) => this.notify(err.message, 'error')
      });
    });
  }


  openEditDialog(product: ProductRead): void {
    if (this.dialogOpen) return;
    this.dialogOpen = true;

    const ref = this.dialog.open(ProductFormDialogComponent, {
      width: '600px',
      data: { product, categories: this.categories }
    });

    ref.afterClosed().subscribe(result => {
      this.dialogOpen = false;
      if (!result || !product.id) return;
      const { _pendingImageFile, _removeImage, ...productData } = result;
      this.productService.update(product.id, productData).subscribe({
        next: () => {
          if (_pendingImageFile) {
            // Nouvelle image
            this.imageService.uploadImage(product.id!, _pendingImageFile).subscribe({
              next: () => { this.notify('Produit mis à jour ✓'); this.loadProducts(); },
              error: () => { this.notify('Produit mis à jour mais erreur image', 'error'); this.loadProducts(); }
            });
          } else if (_removeImage) {
            // Supprimer l'image
            this.imageService.deleteImage(product.id!).subscribe({
              next: () => { this.notify('Produit mis à jour ✓'); this.loadProducts(); },
              error: () => { this.notify('Produit mis à jour ✓'); this.loadProducts(); }
            });
          } else {
            this.notify('Produit mis à jour ✓');
            this.loadProducts();
          }
        },
        error: (err: any) => this.notify(err.message, 'error')
      });
    });
  }

  confirmDelete(product: ProductRead): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Supprimer le produit',
        message: `Supprimer <strong>${product.name}</strong> ?`,
        confirmLabel: 'Supprimer',
        confirmColor: 'warn'
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed || !product.id) return;
      this.productService.delete(product.id).subscribe({
        next: () => { this.notify('Produit supprimé'); this.loadProducts(); },
        error: (err) => this.notify(err.message, 'error')
      });
    });
  }

  getCategoryName(catOrIri: any): string {
    const iri = typeof catOrIri === 'string' ? catOrIri : catOrIri?.['@id'];
    return this.categories.find(c => c['@id'] === iri)?.name ?? '—';
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
