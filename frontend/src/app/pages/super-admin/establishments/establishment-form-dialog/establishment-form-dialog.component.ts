// src/app/pages/super-admin/establishments/establishment-form-dialog/establishment-form-dialog.component.ts

import { Component, OnInit, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EstablishmentService } from '../../../../core/services/establishment.service';
import { Establishment } from '../../../../core/models/establishment.model';

@Component({
  selector: 'app-establishment-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule
  ],
  templateUrl: './establishment-form-dialog.component.html',
  styleUrls: ['./establishment-form-dialog.component.scss']
})
export class EstablishmentFormDialogComponent implements OnInit {
  form!: FormGroup;
  saving = false;
  isEdit: boolean;

  logoFile: File | null = null;
  logoPreview: string | null = null;

  private fb                   = inject(FormBuilder);
  private establishmentService = inject(EstablishmentService);
  private snackBar             = inject(MatSnackBar);
  dialogRef                    = inject(MatDialogRef<EstablishmentFormDialogComponent>);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { establishment: Establishment | null }
  ) {
    this.isEdit = !!data.establishment;
  }

  ngOnInit(): void {
    const e = this.data.establishment;
    const slugValidators = this.isEdit ? [] : [Validators.pattern(/^[a-z0-9-]+$/)];

    this.form = this.fb.group({
      name:          [e?.name          || '', Validators.required],
      slug:          [e?.slug          || '', slugValidators],
      description:   [e?.description   || ''],
      email:         [e?.email         || '', [Validators.email]],
      phone:         [e?.phone         || ''],
      address:       [e?.address       || ''],
      city:          [e?.city          || ''],
      country:       [e?.country       || ''],
      maxUsers:      [e?.maxUsers      ?? 5,  [Validators.required, Validators.min(1)]],
      primaryColor:  [e?.primaryColor  || '#6366f1'],
      secondaryColor:[e?.secondaryColor || '#ec4899'],
    });
  }

  generateSlug(): void {
    const name = this.form.get('name')?.value || '';
    const slug = name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    this.form.get('slug')?.setValue(slug);
  }

  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.logoFile = file;
    const reader = new FileReader();
    reader.onload = (e) => { this.logoPreview = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  removeLogo(): void {
    this.logoFile = null;
    this.logoPreview = null;
  }

  getLogoUrl(logo?: string): string {
    return this.establishmentService.getLogoUrl(logo);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Veuillez corriger les champs en erreur', '✕', {
        duration: 3500,
        panelClass: ['snack-error'],
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
      return;
    }
    this.saving = true;

    const payload = this.form.value;
    const req$ = this.isEdit
      ? this.establishmentService.update(this.data.establishment!.id!, payload)
      : this.establishmentService.create({ ...payload, isActive: true });

    req$.subscribe({
      next: (result: Establishment) => {
        const id = result.id ?? this.data.establishment?.id;
        if (this.logoFile && id) {
          this.establishmentService.uploadLogo(id, this.logoFile).subscribe({
            next: () => { this.saving = false; this.dialogRef.close(true); },
            error: () => { this.saving = false; this.dialogRef.close(true); }
          });
        } else {
          this.saving = false;
          this.dialogRef.close(true);
        }
      },
      error: (err: any) => {
        this.saving = false;
        this.snackBar.open(err.message, '✕', { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }
}
