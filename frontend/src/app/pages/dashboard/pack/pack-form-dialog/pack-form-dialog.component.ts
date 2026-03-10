// src/app/pages/dashboard/pack/pack-form-dialog/pack-form-dialog.component.ts

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
import { MatChipsModule } from '@angular/material/chips';
import { PackRead } from '../../../../core/models/pack.model';
import { ProductRead } from '../../../../core/models/product.model';

export interface PackDialogData {
  pack: PackRead | null;
  products: ProductRead[];
}

@Component({
  selector: 'app-pack-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule,
    MatSlideToggleModule, MatDividerModule, MatChipsModule
  ],
  templateUrl: './pack-form-dialog.component.html',
  styleUrls: ['./pack-form-dialog.component.scss']
})
export class PackFormDialogComponent implements OnInit {
  form!: FormGroup;
  isEdit: boolean;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<PackFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PackDialogData
  ) {
    this.isEdit = !!data.pack;
  }

  ngOnInit(): void {
    const p = this.data.pack;
    this.form = this.fb.group({
      name:        [p?.name ?? '',        [Validators.required, Validators.minLength(2)]],
      description: [p?.description ?? ''],
      price:       [p?.price ?? 0,        [Validators.required, Validators.min(0.01)]],
      isActive:    [p?.isActive ?? true],
      products:    [
        p?.products?.map((prod: any) =>
          typeof prod === 'string' ? prod : prod['@id']
        ) ?? []
      ]
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.dialogRef.close(this.form.value);
  }

  cancel(): void { this.dialogRef.close(null); }

  // Prix total des produits sélectionnés (suggestion)
  get suggestedPrice(): number {
    const selectedIris: string[] = this.form.get('products')?.value ?? [];
    return this.data.products
      .filter(p => selectedIris.includes(p['@id'] ?? ''))
      .reduce((sum, p) => sum + p.price, 0);
  }

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

  applySuggestedPrice(): void {
    this.form.get('price')?.setValue(
      Math.round(this.suggestedPrice * 0.9 * 100) / 100 // -10% par défaut
    );
  }
}
