// src/app/shared/inactivity-dialog/inactivity-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';

export interface ActivityResult {
  type:            string;
  label:           string;
  note?:           string;
  durationMinutes?: number;  // durée de pause (BREAK uniquement)
}

export interface ActivityOption {
  type:  string;
  label: string;
  icon:  string;
  color: string;
}

export const ACTIVITY_OPTIONS: ActivityOption[] = [
  { type: 'CLEANING', label: 'Nettoyage',         icon: 'cleaning_services', color: '#6366f1' },
  { type: 'SETUP',    label: 'Dressage de table',  icon: 'table_restaurant',  color: '#10b981' },
  { type: 'BREAK',    label: 'Break',              icon: 'coffee',            color: '#f59e0b' },
  { type: 'MEETING',  label: 'Réunion',            icon: 'groups',            color: '#3b82f6' },
  { type: 'OTHER',    label: 'Autre',              icon: 'more_horiz',        color: '#9ca3af' },
];

@Component({
  selector: 'app-inactivity-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule, MatButtonModule, MatRippleModule],
  template: `
    <div class="inactive-dialog">

      <div class="id-header">
        <div class="id-icon-wrap">
          <mat-icon>hourglass_empty</mat-icon>
        </div>
        <h2>Que faites-vous ?</h2>
        <p>Vous êtes inactif depuis {{ data.minutes }} min. Sélectionnez votre activité pour continuer.</p>
      </div>

      <div class="id-grid">
        <button
          mat-ripple
          class="id-card"
          *ngFor="let opt of activities"
          [class.selected]="selected?.type === opt.type"
          (click)="select(opt)"
          [style.--card-color]="opt.color">
          <mat-icon [style.color]="opt.color">{{ opt.icon }}</mat-icon>
          <span>{{ opt.label }}</span>
        </button>
      </div>

      <!-- Durée de pause (uniquement pour BREAK) -->
      <div class="id-duration" *ngIf="selected?.type === 'BREAK'">
        <div class="id-duration-label">
          <mat-icon>timer</mat-icon>
          <span>Durée de la pause</span>
        </div>
        <div class="id-duration-chips">
          <button
            *ngFor="let d of durationOptions"
            class="duration-chip"
            [class.selected]="durationMinutes === d"
            (click)="durationMinutes = d">
            {{ d }} min
          </button>
        </div>
      </div>

      <div class="id-note" *ngIf="selected">
        <mat-icon>edit_note</mat-icon>
        <input [(ngModel)]="note" placeholder="Précision (optionnel)..." maxlength="100">
      </div>

      <div class="id-footer">
        <button
          class="id-confirm-btn"
          [disabled]="!selected || (selected.type === 'BREAK' && !durationMinutes)"
          (click)="confirm()">
          <mat-icon>check_circle</mat-icon>
          Confirmer et reprendre
        </button>
      </div>

    </div>
  `,
  styles: [`
    .inactive-dialog {
      font-family: 'DM Sans', sans-serif;
      padding: 1.5rem;
      max-width: 420px;
      width: 100%;
    }

    .id-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .id-icon-wrap {
      width: 56px; height: 56px; border-radius: 16px;
      background: linear-gradient(135deg, #f59e0b22, #fde68a44);
      border: 2px solid #fde68a;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1rem;
      mat-icon { color: #f59e0b; font-size: 1.75rem; width: 1.75rem; height: 1.75rem; }
    }

    h2 { font-size: 1.25rem; font-weight: 800; color: #1a1a2e; margin: 0 0 0.5rem; }

    p { font-size: 0.82rem; color: #6b7280; margin: 0; line-height: 1.5; }

    .id-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.625rem;
      margin-bottom: 1rem;
    }

    .id-card {
      display: flex; flex-direction: column; align-items: center;
      gap: 0.5rem; padding: 0.875rem 0.5rem;
      border-radius: 14px; border: 2px solid #f1f5f9;
      background: white; cursor: pointer;
      transition: all 0.15s; font-family: 'DM Sans', sans-serif;

      mat-icon { font-size: 1.5rem; width: 1.5rem; height: 1.5rem; }
      span { font-size: 0.72rem; font-weight: 600; color: #374151; text-align: center; }

      &:hover { border-color: var(--card-color); background: color-mix(in srgb, var(--card-color) 8%, white); }
      &.selected {
        border-color: var(--card-color);
        background: color-mix(in srgb, var(--card-color) 10%, white);
        box-shadow: 0 0 0 4px color-mix(in srgb, var(--card-color) 15%, transparent);
      }
    }

    .id-duration {
      margin-bottom: 1rem;
    }

    .id-duration-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.78rem; font-weight: 700; color: #6b7280;
      margin-bottom: 0.5rem;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; color: #f59e0b; }
    }

    .id-duration-chips {
      display: flex; flex-wrap: wrap; gap: 8px;
    }

    .duration-chip {
      padding: 6px 14px; border-radius: 99px;
      border: 1.5px solid #e5e7eb; background: white;
      font-size: 0.78rem; font-weight: 600; color: #374151;
      cursor: pointer; transition: all 0.12s;
      font-family: 'DM Sans', sans-serif;

      &:hover { border-color: #f59e0b; color: #f59e0b; }
      &.selected {
        background: #f59e0b; border-color: #f59e0b;
        color: white;
      }
    }

    .id-note {
      display: flex; align-items: center; gap: 8px;
      background: #f8fafc; border-radius: 10px; padding: 0.625rem 0.875rem;
      margin-bottom: 1rem;
      mat-icon { color: #9ca3af; font-size: 1rem; width: 1rem; height: 1rem; flex-shrink: 0; }
      input {
        flex: 1; border: none; background: none; outline: none;
        font-size: 0.82rem; color: #374151; font-family: 'DM Sans', sans-serif;
        &::placeholder { color: #d1d5db; }
      }
    }

    .id-footer { display: flex; justify-content: center; }

    .id-confirm-btn {
      display: flex; align-items: center; gap: 8px;
      width: 100%; height: 48px; border-radius: 12px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none; color: white; font-size: 0.9rem; font-weight: 700;
      cursor: pointer; justify-content: center;
      font-family: 'DM Sans', sans-serif;
      transition: opacity 0.15s;
      mat-icon { font-size: 1.1rem; width: 1.1rem; height: 1.1rem; }

      &:disabled {
        background: #e5e7eb; color: #9ca3af; cursor: not-allowed;
      }
      &:not(:disabled):hover { opacity: 0.9; }
    }
  `]
})
export class InactivityDialogComponent {
  activities      = ACTIVITY_OPTIONS;
  selected:         ActivityOption | null = null;
  note              = '';
  durationMinutes:  number | null = null;
  durationOptions   = [5, 10, 15, 20, 30, 45, 60];

  constructor(
    public dialogRef: MatDialogRef<InactivityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { minutes: number }
  ) {}

  select(opt: ActivityOption): void {
    this.selected = opt;
    // Réinitialiser la durée si on change d'activité
    if (opt.type !== 'BREAK') this.durationMinutes = null;
  }

  confirm(): void {
    if (!this.selected) return;
    if (this.selected.type === 'BREAK' && !this.durationMinutes) return;
    const result: ActivityResult = {
      type:            this.selected.type,
      label:           this.selected.label,
      note:            this.note.trim() || undefined,
      durationMinutes: this.selected.type === 'BREAK' ? this.durationMinutes! : undefined,
    };
    this.dialogRef.close(result);
  }
}
