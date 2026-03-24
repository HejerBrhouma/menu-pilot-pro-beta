// src/app/shared/product-image-upload/product-image-upload.component.ts

import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductImageService } from '../../core/services/product-image.service';

@Component({
  selector: 'app-product-image-upload',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="image-upload-zone"
      [class.has-image]="currentImageUrl"
      [class.dragover]="isDragOver"
      (dragover)="onDragOver($event)"
      (dragleave)="isDragOver = false"
      (drop)="onDrop($event)"
      (click)="fileInput.click()">

      <!-- Image existante -->
      <ng-container *ngIf="currentImageUrl && !uploading">
        <img [src]="currentImageUrl" class="preview-img" [alt]="'Image produit'">
        <div class="image-overlay">
          <button class="overlay-btn change" (click)="fileInput.click(); $event.stopPropagation()">
            <mat-icon>photo_camera</mat-icon> Changer
          </button>
          <button class="overlay-btn delete" (click)="deleteImage(); $event.stopPropagation()">
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      </ng-container>

      <!-- Spinner upload -->
      <div class="upload-spinner" *ngIf="uploading">
        <mat-spinner diameter="32"></mat-spinner>
        <span>Upload en cours...</span>
      </div>

      <!-- Zone vide -->
      <ng-container *ngIf="!currentImageUrl && !uploading">
        <mat-icon class="upload-icon">add_photo_alternate</mat-icon>
        <span class="upload-label">Ajouter une photo</span>
        <span class="upload-hint">JPG, PNG, WebP · Max 5MB</span>
      </ng-container>

      <input #fileInput type="file" accept="image/*" style="display:none"
        (change)="onFileSelected($event)">
    </div>
  `,
  styles: [`
    .image-upload-zone {
      width: 100%; height: 160px; border-radius: 12px;
      border: 2px dashed #e5e7eb; background: #f8fafc;
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 6px; cursor: pointer;
      transition: all 0.15s; position: relative; overflow: hidden;
      &:hover, &.dragover { border-color: #6366f1; background: #eef2ff; }
      &.has-image { border-style: solid; border-color: #e5e7eb; }
    }
    .preview-img {
      width: 100%; height: 100%; object-fit: cover; border-radius: 10px;
    }
    .image-overlay {
      position: absolute; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center; gap: 0.75rem;
      opacity: 0; transition: opacity 0.2s; border-radius: 10px;
      .image-upload-zone:hover & { opacity: 1; }
    }
    .overlay-btn {
      display: flex; align-items: center; gap: 5px; padding: 6px 14px;
      border-radius: 8px; border: none; cursor: pointer; font-size: 0.8rem;
      font-weight: 600; transition: all 0.15s;
      mat-icon { font-size: 0.9rem; width: 0.9rem; height: 0.9rem; }
      &.change { background: white; color: #1a1a2e; &:hover { background: #f4f6fb; } }
      &.delete  { background: #ef4444; color: white; &:hover { background: #dc2626; } }
    }
    .upload-spinner { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #6366f1; font-size: 0.8rem; }
    .upload-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; color: #9ca3af; }
    .upload-label { font-size: 0.875rem; font-weight: 600; color: #374151; }
    .upload-hint  { font-size: 0.72rem; color: #9ca3af; }
  `]
})
export class ProductImageUploadComponent {
  @Input() productId:     number | null = null;
  @Input() currentImage:  string | null = null;
  @Output() imageChanged = new EventEmitter<string | null>();

  uploading  = false;
  isDragOver = false;

  private imageService = inject(ProductImageService);
  private snackBar     = inject(MatSnackBar);

  get currentImageUrl(): string | null {
    return this.imageService.getImageUrl(this.currentImage);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (file) this.upload(file);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) this.upload(file);
  }

  upload(file: File): void {
    if (!this.productId) {
      this.snackBar.open('Enregistrez le produit avant d\'ajouter une image', '✕', { duration: 3000 });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.snackBar.open('Fichier trop volumineux (max 5MB)', '✕', { duration: 3000 });
      return;
    }
    this.uploading = true;
    this.imageService.uploadImage(this.productId, file).subscribe({
      next: (res) => {
        this.uploading    = false;
        this.currentImage = res.image;
        this.imageChanged.emit(res.image);
        this.snackBar.open('Image uploadée ✓', '✕', { duration: 2000, panelClass: ['snack-success'] });
      },
      error: (err) => {
        this.uploading = false;
        this.snackBar.open(err.error?.error || 'Erreur upload', '✕', { duration: 3000 });
      }
    });
  }

  deleteImage(): void {
    if (!this.productId) return;
    this.imageService.deleteImage(this.productId).subscribe({
      next: () => {
        this.currentImage = null;
        this.imageChanged.emit(null);
        this.snackBar.open('Image supprimée', '✕', { duration: 2000 });
      }
    });
  }
}
