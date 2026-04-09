// src/app/shared/star-rating/star-rating.component.ts

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="star-rating" *ngIf="count > 0">
      <div class="stars">
        <mat-icon *ngFor="let s of starsArray"
          [class.full]="s <= fullStars"
          [class.half]="s === halfStar">
          {{ s <= fullStars ? 'star' : (s === halfStar ? 'star_half' : 'star_border') }}
        </mat-icon>
      </div>
      <span class="rating-val">{{ rating | number:'1.1-1' }}</span>
      <span class="rating-count" *ngIf="showCount">({{ count }})</span>
    </div>
    <div class="no-rating" *ngIf="count === 0 && showEmpty">
      <mat-icon>star_border</mat-icon>
      <span>Pas encore d'avis</span>
    </div>
  `,
  styles: [`
    .star-rating {
      display: flex; align-items: center; gap: 3px;
    }
    .stars {
      display: flex; gap: 1px;
      mat-icon {
        font-size: 0.875rem; width: 0.875rem; height: 0.875rem;
        color: #e5e7eb;
        &.full, &.half { color: #f59e0b; }
      }
    }
    .rating-val {
      font-size: 0.75rem; font-weight: 700; color: #f59e0b;
    }
    .rating-count {
      font-size: 0.68rem; color: #9ca3af;
    }
    .no-rating {
      display: flex; align-items: center; gap: 3px;
      font-size: 0.68rem; color: #d1d5db;
      mat-icon { font-size: 0.75rem; width: 0.75rem; height: 0.75rem; }
    }
  `]
})
export class StarRatingComponent {
  @Input() rating  = 0;
  @Input() count   = 0;
  @Input() showCount = true;
  @Input() showEmpty = false;

  readonly starsArray = [1, 2, 3, 4, 5];

  get fullStars(): number { return Math.floor(this.rating); }
  get halfStar(): number | null {
    return (this.rating % 1) >= 0.3 ? Math.ceil(this.rating) : null;
  }
}
