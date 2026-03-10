// src/app/pages/dashboard/menu/menu-form-dialog/menu-form-dialog.component.ts

import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MenuRead } from '../../../../core/models/menu.model';
import { ProductRead } from '../../../../core/models/product.model';
import { PackRead } from '../../../../core/models/pack.model';
import { Category } from '../../../../core/models/category.model';

export interface MenuDialogData {
  menu: MenuRead | null;
  products: ProductRead[];
  packs: PackRead[];
  categories: Category[];
}

@Component({
  selector: 'app-menu-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule,
    MatSlideToggleModule, MatDividerModule,
    MatExpansionModule, MatTooltipModule
  ],
  templateUrl: './menu-form-dialog.component.html',
  styleUrls: ['./menu-form-dialog.component.scss']
})
export class MenuFormDialogComponent implements OnInit {
  form!: FormGroup;
  isEdit: boolean;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<MenuFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MenuDialogData
  ) {
    this.isEdit = !!data.menu;
  }

  ngOnInit(): void {
    const m = this.data.menu;
    this.form = this.fb.group({
      name:        [m?.name ?? '',        [Validators.required, Validators.minLength(2)]],
      description: [m?.description ?? ''],
      isActive:    [m?.isActive ?? true],
      timeStart:   [m?.timeStart ?? ''],
      timeEnd:     [m?.timeEnd ?? ''],
      sections:    this.fb.array(
        m?.sections?.map(s => this.buildSectionGroup(s)) ?? []
      )
    });
  }

  // ── Sections ──────────────────────────────

  get sections(): FormArray {
    return this.form.get('sections') as FormArray;
  }

  buildSectionGroup(section?: any): FormGroup {
    return this.fb.group({
      title:      [section?.title ?? '',  [Validators.required]],
      position:   [section?.position ?? this.sections?.length ?? 0],
      products:   [section?.products?.map((p: any) => typeof p === 'string' ? p : p['@id']) ?? []],
      packs:      [section?.packs?.map((p: any) => typeof p === 'string' ? p : p['@id']) ?? []],
      categories: [section?.categories?.map((c: any) => typeof c === 'string' ? c : c['@id']) ?? []]
    });
  }

  addSection(): void {
    this.sections.push(this.buildSectionGroup());
  }

  removeSection(index: number): void {
    this.sections.removeAt(index);
  }

  moveSection(index: number, direction: 'up' | 'down'): void {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= this.sections.length) return;
    const current = this.sections.at(index);
    const other   = this.sections.at(target);
    this.sections.setControl(index, other);
    this.sections.setControl(target, current);
    // Mettre à jour les positions
    this.sections.controls.forEach((ctrl, i) => ctrl.get('position')?.setValue(i));
  }

  // ── Submit ────────────────────────────────

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
}
