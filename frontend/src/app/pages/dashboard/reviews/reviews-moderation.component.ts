// src/app/pages/dashboard/reviews/reviews-moderation.component.ts

import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReviewService } from '../../../core/services/review.service';

@Component({
  selector: 'app-reviews-moderation',
  standalone: true,
  imports: [
    CommonModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule
  ],
  templateUrl: './reviews-moderation.component.html',
  styleUrls: ['./reviews-moderation.component.scss']
})
export class ReviewsModerationComponent implements OnInit {
  reviews:  any[] = [];
  loading   = true;
  moderating: number | null = null;

  private reviewSvc = inject(ReviewService);
  private snackBar  = inject(MatSnackBar);
  private cdr       = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    this.loading = true;
    this.reviewSvc.getPendingReviews().subscribe({
      next: (reviews) => {
        this.reviews = reviews;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  approve(id: number): void {
    this.moderating = id;
    this.reviewSvc.moderateReview(id, 'approve').subscribe({
      next: () => {
        this.moderating = null;
        this.reviews    = this.reviews.filter(r => r.id !== id);
        this.snackBar.open('Avis approuvé ✓', '✕', {
          duration: 2500, panelClass: ['snack-success']
        });
        this.cdr.detectChanges();
      },
      error: () => { this.moderating = null; this.cdr.detectChanges(); }
    });
  }

  reject(id: number): void {
    this.moderating = id;
    this.reviewSvc.moderateReview(id, 'reject').subscribe({
      next: () => {
        this.moderating = null;
        this.reviews    = this.reviews.filter(r => r.id !== id);
        this.snackBar.open('Avis rejeté', '✕', { duration: 2500 });
        this.cdr.detectChanges();
      },
      error: () => { this.moderating = null; this.cdr.detectChanges(); }
    });
  }

  getTargetIcon(type: string): string {
    const icons: Record<string, string> = {
      ESTABLISHMENT: 'store',
      PRODUCT:       'inventory_2',
      PACK:          'layers',
    };
    return icons[type] || 'star';
  }

  getTargetLabel(type: string): string {
    const labels: Record<string, string> = {
      ESTABLISHMENT: 'Enseigne',
      PRODUCT:       'Produit',
      PACK:          'Formule',
    };
    return labels[type] || type;
  }

  getStars(rating: number): number[] {
    return [1, 2, 3, 4, 5];
  }
}
