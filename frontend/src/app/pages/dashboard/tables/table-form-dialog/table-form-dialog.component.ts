// src/app/pages/dashboard/tables/table-form-dialog/table-form-dialog.component.ts

import { Component, OnInit, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../../core/services/order.service';
import { RestaurantTable } from '../../../../core/models/order.model';

@Component({
  selector: 'app-table-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule,
    MatSlideToggleModule, MatSnackBarModule
  ],
  template: `
    <div class="dialog-header">
      <mat-icon>table_restaurant</mat-icon>
      <h2>{{ isEdit ? 'Modifier la table' : 'Nouvelle table' }}</h2>
    </div>

    <mat-dialog-content>
      <form [formGroup]="form" class="form">

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nom de la table</mat-label>
          <input matInput formControlName="name" placeholder="Ex: Table 1, Terrasse A, Bar...">
          <mat-icon matSuffix>table_restaurant</mat-icon>
          <mat-error>Requis</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Capacité (nombre de personnes)</mat-label>
          <input matInput type="number" formControlName="capacity" min="1" max="50">
          <mat-icon matSuffix>people</mat-icon>
          <mat-error>Capacité requise (min 1)</mat-error>
        </mat-form-field>

        <div class="toggle-row">
          <mat-slide-toggle formControlName="isActive" color="primary">
            Table active
          </mat-slide-toggle>
        </div>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close [disabled]="saving">Annuler</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving || form.invalid">
        <mat-spinner diameter="16" *ngIf="saving"></mat-spinner>
        <mat-icon *ngIf="!saving">save</mat-icon>
        {{ isEdit ? 'Enregistrer' : 'Créer' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header { display:flex; align-items:center; gap:10px; padding:1.5rem 1.5rem 0; }
    .dialog-header mat-icon { color:#6366f1; font-size:1.75rem; width:1.75rem; height:1.75rem; }
    .dialog-header h2 { margin:0; font-size:1.2rem; font-weight:700; }
    mat-dialog-content { padding:1.25rem 1.5rem !important; }
    .form { display:flex; flex-direction:column; gap:0.75rem; }
    .full-width { width:100%; }
    .toggle-row { padding:0.25rem 0; }
    mat-dialog-actions { padding:1rem 1.5rem !important; gap:0.75rem; }
    mat-dialog-actions button { border-radius:10px; display:flex; align-items:center; gap:6px; }
  `]
})
export class TableFormDialogComponent implements OnInit {
  form!: FormGroup;
  saving   = false;
  isEdit: boolean;

  private fb           = inject(FormBuilder);
  private orderService = inject(OrderService);
  private snackBar     = inject(MatSnackBar);
  dialogRef            = inject(MatDialogRef<TableFormDialogComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { table: RestaurantTable | null }) {
    this.isEdit = !!data.table;
  }

  ngOnInit(): void {
    const t = this.data.table;
    this.form = this.fb.group({
      name:     [t?.name     || '', Validators.required],
      capacity: [t?.capacity || 4,  [Validators.required, Validators.min(1)]],
      isActive: [t?.isActive ?? true],
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;

    const req$ = this.isEdit
      ? this.orderService.updateTable(this.data.table!.id!, this.form.value)
      : this.orderService.createTable(this.form.value);

    req$.subscribe({
      next: () => { this.saving = false; this.dialogRef.close(true); },
      error: (err: any) => {
        this.saving = false;
        this.snackBar.open(err.message, '✕', { duration: 4000 });
      }
    });
  }
}
