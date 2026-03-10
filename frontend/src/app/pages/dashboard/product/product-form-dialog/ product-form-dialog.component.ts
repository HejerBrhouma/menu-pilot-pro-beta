// src/app/pages/dashboard/product/product-form-dialog/product-form-dialog.component.ts

import { Component, Inject, OnInit } from '@angular/core';
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
import { ProductRead } from '../../../../core/models/product.model';
import { Category } from '../../../../core/models/category.model';

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
    MatSlideToggleModule, MatDividerModule
  ],
  templateUrl: './product-form-dialog.component.html',
  styleUrls: ['./product-form-dialog.component.scss']
})
export class ProductFormDialogComponent implements OnInit {
  form!: FormGroup;
  isEdit: boolean;

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
      name: [p?.name ?? '', [Validators.required, Validators.minLength(2)]],
      price: [p?.price ?? 0, [Validators.required, Validators.min(0.01)]],
      description: [p?.description ?? ''],
      categories: [
        p?.categories?.map((c: any) => typeof c === 'string' ? c : c['@id']) ?? []
      ],
      isAvailable: [p?.isAvailable ?? true]
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.dialogRef.close(this.form.value);
  }

  cancel(): void { this.dialogRef.close(null); }

  get nameError(): string {
    const c = this.form.get('name');
    if (c?.hasError('required')) return 'Le nom est requis';
    if (c?.hasError('minlength')) return 'Minimum 2 caractères';
    return '';
  }

  get priceError(): string {
    const c = this.form.get('price');
    if (c?.hasError('required')) return 'Le prix est requis';
    if (c?.hasError('min')) return 'Le prix doit être > 0';
    return '';
  }
}
