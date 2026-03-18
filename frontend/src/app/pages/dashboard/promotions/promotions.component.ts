// src/app/pages/dashboard/promotions/promotions.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div style="padding:2rem">
      <h1 style="display:flex;align-items:center;gap:8px;font-size:1.75rem;font-weight:700;color:#1a1a2e">
        <mat-icon style="color:#ec4899">local_offer</mat-icon>
        Promotions
      </h1>
      <p style="color:#6b7280">Ce module sera disponible prochainement.</p>
    </div>
  `
})
export class PromotionsComponent {}
