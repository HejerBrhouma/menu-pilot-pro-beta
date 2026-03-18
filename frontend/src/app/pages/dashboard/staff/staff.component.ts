// src/app/pages/dashboard/staff/staff.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div style="padding:2rem">
      <h1 style="display:flex;align-items:center;gap:8px;font-size:1.75rem;font-weight:700;color:#1a1a2e">
        <mat-icon style="color:#6366f1">badge</mat-icon>
        Personnel
      </h1>
      <p style="color:#6b7280">Ce module sera disponible prochainement.</p>
    </div>
  `
})
export class StaffComponent {}
