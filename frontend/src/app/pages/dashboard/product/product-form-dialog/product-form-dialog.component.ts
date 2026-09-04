// src/app/pages/dashboard/product/product-form-dialog/product-form-dialog.component.ts

import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductRead } from '../../../../core/models/product.model';
import { Category } from '../../../../core/models/category.model';
import { ProductImageService } from '../../../../core/services/product-image.service';

export interface ProductDialogData {
  product: ProductRead | null;
  categories: Category[];
}

@Component({
  selector: 'app-product-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule,
    MatSlideToggleModule, MatDividerModule,
    MatProgressSpinnerModule, MatSnackBarModule
  ],
  templateUrl: './product-form-dialog.component.html',
  styleUrls: ['./product-form-dialog.component.scss']
})
export class ProductFormDialogComponent implements OnInit {
  form!: FormGroup;
  isEdit:    boolean;

  currentImage:  string | null = null;
  previewUrl:    string | null = null;
  pendingFile:   File | null = null;
  uploading      = false;
  isDragOver     = false;
  submitting     = false;
  private imageService = inject(ProductImageService);
  private snackBar     = inject(MatSnackBar);

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ProductFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductDialogData
  ) {
    this.isEdit = !!data.product;
  }

  ngOnInit(): void {
    const p = this.data.product;

    this.form = this.fb.group({
      name:        [p?.name        ?? '', [Validators.required, Validators.minLength(2)]],
      price:       [p?.price       ?? 0,  [Validators.required, Validators.min(0.01)]],
      description: [p?.description ?? ''],
      categories:  [p?.categories?.map((c: any) => typeof c === 'string' ? c : c['@id']) ?? []],
      isAvailable: [p?.isAvailable ?? true],
      trackStock:  [p?.trackStock  ?? false],
      stock:       [p?.stock       ?? null]
    });

    // Image existante
    const prod = p as any;
    if (prod?.image) {
      this.currentImage = prod.image;
      this.previewUrl   = this.imageService.getImageUrl(prod.image);
    }
  }

  // ── Gestion image ─────────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (file) this.prepareImage(file);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(): void {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) this.prepareImage(file);
  }

  prepareImage(file: File): void {
    if (file.size > 5 * 1024 * 1024) {
      this.snackBar.open('Fichier trop volumineux (max 5MB)', '✕', { duration: 3000 });
      return;
    }
    this.pendingFile = file;
    // Aperçu local immédiat
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.pendingFile  = null;
    this.previewUrl   = null;
    this.currentImage = null;
  }

  // ── Upload après création/modification ────────────────────────────

  private uploadPendingImage(productId: number): Promise<void> {
    if (!this.pendingFile) return Promise.resolve();

    return new Promise((resolve, reject) => {
      this.uploading = true;
      this.imageService.uploadImage(productId, this.pendingFile!).subscribe({
        next: () => { this.uploading = false; resolve(); },
        error: (err) => {
          this.uploading = false;
          this.snackBar.open('Erreur upload image : ' + (err.error?.error || err.message), '✕', { duration: 4000 });
          resolve(); // On continue même si l'image échoue
        }
      });
    });
  }

  // ── Soumission ────────────────────────────────────────────────────

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.submitting) return;
    this.submitting = true;
    this.dialogRef.close({
      ...this.form.value,
      _pendingImageFile: this.pendingFile,
      _removeImage:      !this.previewUrl && this.currentImage !== null,
    });
  }

  cancel(): void { this.dialogRef.close(null); }

  // ── Erreurs ───────────────────────────────────────────────────────

  get nameError(): string {
    const c = this.form.get('name');
    if (c?.hasError('required'))   return 'Le nom est requis';
    if (c?.hasError('minlength'))  return 'Minimum 2 caractères';
    return '';
  }

  get isTrackingStock(): boolean {
    return this.form.get('trackStock')?.value === true;
  }

  get priceError(): string {
    const c = this.form.get('price');
    if (c?.hasError('required')) return 'Le prix est requis';
    if (c?.hasError('min'))      return 'Le prix doit être > 0';
    return '';
  }
}
