// src/app/pages/dashboard/promotions/promotion-form-dialog/promotion-form-dialog.component.ts

import { Component, OnInit, Inject, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient } from '@angular/common/http';
import { PromotionService } from '../../../../core/services/promotion.service';
import {
  Promotion, SCOPE_OPTIONS, TYPE_OPTIONS,
  RECURRENCE_OPTIONS, DAYS_OPTIONS,
  SPECIAL_EVENT_OPTIONS
} from '../../../../core/models/promotion.model';

@Component({
  selector: 'app-promotion-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatDatepickerModule, MatNativeDateModule,
    MatSlideToggleModule, MatCheckboxModule, MatChipsModule, MatDividerModule
  ],
  templateUrl: './promotion-form-dialog.component.html',
  styleUrls: ['./promotion-form-dialog.component.scss']
})
export class PromotionFormDialogComponent implements OnInit {
  form!: FormGroup;
  saving         = false;
  isEdit: boolean;

  scopeOptions         = SCOPE_OPTIONS;
  typeOptions          = TYPE_OPTIONS;
  recurrenceOptions    = RECURRENCE_OPTIONS;
  daysOptions          = DAYS_OPTIONS;
  specialEventOptions  = SPECIAL_EVENT_OPTIONS;

  targets: { id: number; name: string; price?: number }[] = [];
  loadingTargets = false;

  // Dates custom pour EVENT_CUSTOM
  customDateInput = '';
  customDates: string[] = [];

  private fb               = inject(FormBuilder);
  private http             = inject(HttpClient);
  private promotionService = inject(PromotionService);
  private snackBar         = inject(MatSnackBar);
  dialogRef                = inject(MatDialogRef<PromotionFormDialogComponent>);
  private cdr              = inject(ChangeDetectorRef);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { promotion: Promotion | null }
  ) {
    this.isEdit = !!data.promotion;
  }

  ngOnInit(): void {
    const p = this.data.promotion;

    this.form = this.fb.group({
      name:           [p?.name           || '', Validators.required],
      description:    [p?.description    || ''],
      type:           [p?.type           || 'PERCENTAGE', Validators.required],
      value:          [p?.value          || 10, [Validators.required, Validators.min(0.01)]],
      scope:          [p?.scope          || 'PRODUCT', Validators.required],
      targetIds:      [p?.targetIds      || [], Validators.required],
      // Période
      startDate:      [p?.startDate ? new Date(p.startDate) : null],
      endDate:        [p?.endDate   ? new Date(p.endDate)   : null],
      // Horaires
      startTime:      [p?.startTime || null],
      endTime:        [p?.endTime   || null],
      // Récurrence
      recurrenceType: [p?.recurrenceType || 'NONE'],
      recurrenceDays: [p?.recurrenceDays || []],
      // Événement spécial
      specialEvent:      [p?.specialEvent      || 'NONE'],
      specialEventDate:  [p?.specialEventDate ? new Date(p.specialEventDate) : null],
      isActive:       [p?.isActive ?? true],
    });

    if (p?.customDates) this.customDates = [...p.customDates];

    this.onScopeChange(this.form.get('scope')?.value);
    this.form.get('scope')?.valueChanges.subscribe(s => {
      this.form.get('targetIds')?.setValue([]);
      this.onScopeChange(s);
    });
  }

  onScopeChange(scope: string): void {
    this.loadingTargets = true;
    this.targets = [];
    const urlMap: Record<string, string> = {
      PRODUCT:  '/api/products?isAvailable=true',
      CATEGORY: '/api/categories',
      PACK:     '/api/packs?isActive=true',
      MENU:     '/api/menus?isActive=true',
    };
    const url = urlMap[scope];
    if (!url) { this.loadingTargets = false; return; }

    this.http.get<any>(url).subscribe({
      next: (res: any) => {
        this.targets = (res['hydra:member'] || []).map((item: any) => ({
          id: item.id, name: item.name, price: item.price ?? null
        }));
        this.loadingTargets = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loadingTargets = false; }
    });
  }

  // ── Getters pour affichage conditionnel ──────────────────────────────

  get showHasEndDate(): boolean { return true; }
  get recurrenceType(): string  { return this.form.get('recurrenceType')?.value; }
  get specialEvent(): string    { return this.form.get('specialEvent')?.value; }
  get valueLabel(): string {
    return this.form.get('type')?.value === 'PERCENTAGE' ? 'Réduction (%)' : 'Réduction (TND)';
  }

  get needsSpecialEventDate(): boolean {
    return ['AID_ADHA', 'AID_FITR'].includes(this.specialEvent);
  }

  get needsCustomDates(): boolean {
    return this.specialEvent === 'CUSTOM';
  }

  // ── Gestion dates custom ─────────────────────────────────────────────

  addCustomDate(): void {
    if (!this.customDateInput) return;
    if (!this.customDates.includes(this.customDateInput)) {
      this.customDates.push(this.customDateInput);
    }
    this.customDateInput = '';
  }

  removeCustomDate(date: string): void {
    this.customDates = this.customDates.filter(d => d !== date);
  }

  isDaySelected(day: number): boolean {
    const days: number[] = this.form.get('recurrenceDays')?.value || [];
    return days.includes(day);
  }

  toggleDay(day: number): void {
    const days: number[] = [...(this.form.get('recurrenceDays')?.value || [])];
    const idx = days.indexOf(day);
    if (idx > -1) days.splice(idx, 1);
    else days.push(day);
    this.form.get('recurrenceDays')?.setValue(days);
  }

  // ── Sauvegarde ───────────────────────────────────────────────────────

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;

    const val = this.form.value;
    const payload: Partial<Promotion> = {
      name:           val.name,
      description:    val.description,
      type:           val.type,
      value:          val.value,
      scope:          val.scope,
      targetIds:      val.targetIds,
      startDate:      val.startDate ? new Date(val.startDate).toISOString() : null,
      endDate:        val.endDate   ? new Date(val.endDate).toISOString()   : null,
      startTime:      val.startTime || null,
      endTime:        val.endTime   || null,
      recurrenceType: val.recurrenceType,
      recurrenceDays: val.recurrenceType === 'WEEKLY' ? val.recurrenceDays : null,
      specialEvent:   val.specialEvent,
      specialEventDate: val.specialEventDate ? new Date(val.specialEventDate).toISOString() : null,
      customDates:    this.needsCustomDates ? this.customDates : null,
      isActive:       val.isActive,
    };

    const req$ = this.isEdit
      ? this.promotionService.update(this.data.promotion!.id!, payload)
      : this.promotionService.create(payload);

    req$.subscribe({
      next: () => { this.saving = false; this.dialogRef.close(true); },
      error: (err: any) => {
        this.saving = false;
        this.snackBar.open(err.message, '✕', { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }
}
