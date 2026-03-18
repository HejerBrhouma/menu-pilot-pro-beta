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
import { EstablishmentService } from '../../../../core/services/establishment.service';
import { Establishment } from '../../../../core/models/establishment.model';

@Component({
  selector: 'app-establishment-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  templateUrl: './establishment-form-dialog.component.html',
  styleUrls: ['./establishment-form-dialog.component.scss']
})
export class EstablishmentFormDialogComponent implements OnInit {
  form!: FormGroup;
  saving = false;
  isEdit: boolean;

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
    this.form = this.fb.group({
      name:         [e?.name        || '', Validators.required],
      slug:         [e?.slug        || '', [Validators.pattern(/^[a-z0-9-]+$/)]],
      description:  [e?.description || ''],
      email:        [e?.email       || '', Validators.email],
      phone:        [e?.phone       || ''],
      address:      [e?.address     || ''],
      city:         [e?.city        || ''],
      country:      [e?.country     || ''],
      maxUsers:     [e?.maxUsers    || 5,  [Validators.required, Validators.min(1)]],
      primaryColor: [e?.primaryColor   || '#6366f1'],
      secondaryColor:[e?.secondaryColor || '#ec4899'],
    });
  }

  // Génère le slug automatiquement depuis le nom
  generateSlug(): void {
    const name = this.form.get('name')?.value || '';
    const slug = name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // enlever accents
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    this.form.get('slug')?.setValue(slug);
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;

    const payload = this.form.value;

    const req$ = this.isEdit
      ? this.establishmentService.update(this.data.establishment!.id!, payload)
      : this.establishmentService.create({ ...payload, isActive: true });

    req$.subscribe({
      next: () => {
        this.saving = false;
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.saving = false;
        this.snackBar.open(err.message, '✕', { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }
}
