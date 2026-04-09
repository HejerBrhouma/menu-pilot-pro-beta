// src/app/pages/public/review-form/review-form.component.ts

import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReviewService } from '../../../core/services/review.service';
import { CustomerAuthService } from '../../../core/services/customer-auth.service';

interface ReviewItem {
  targetType: string;
  targetId:   number;
  targetName: string;
  rating:     number;
  comment:    string;
  isLiked:    boolean | null;
  submitted:  boolean;
  reviewId:   number | null;
  photoFile:  File | null;
  photoPreview: string | null;
}

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule,
    MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './review-form.component.html',
  styleUrls: ['./review-form.component.scss']
})
export class ReviewFormComponent implements OnInit {
  orderId      = 0;
  loading      = false;
  submitting   = false;
  submitted    = false;

  // Avis anonyme
  isAnonymous  = false;
  guestName    = '';

  reviewItems: ReviewItem[] = [];
  stars = [1, 2, 3, 4, 5];

  private route       = inject(ActivatedRoute);
  private router      = inject(Router);
  private reviewSvc   = inject(ReviewService);
  private authService = inject(CustomerAuthService);
  private snackBar    = inject(MatSnackBar);
  private cdr         = inject(ChangeDetectorRef);

  get isLoggedIn() { return this.authService.isLoggedIn; }
  get customer()   { return this.authService.currentCustomer; }

  ngOnInit(): void {
    this.orderId    = Number(this.route.snapshot.paramMap.get('orderId'));
    this.isAnonymous = !this.isLoggedIn;
    this.loadOrderItems();
  }

  loadOrderItems(): void {
    this.loading = true;

    if (this.isLoggedIn) {
      this.reviewSvc.getCustomerOrders().subscribe({
        next: (orders) => {
          const order = orders.find((o: any) => o.id === this.orderId);
          if (!order) { this.router.navigate(['/account']); return; }
          this.buildReviewItems(order);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => { this.loading = false; this.cdr.detectChanges(); }
      });
    } else {
      // Anonyme — charger depuis l'API publique
      this.reviewSvc.getOrderForReview(this.orderId).subscribe({
        next: (order: any) => {
          this.buildReviewItems(order);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => { this.loading = false; this.cdr.detectChanges(); }
      });
    }
  }

  buildReviewItems(order: any): void {
    this.reviewItems = [];

    // Avis enseigne
    this.reviewItems.push({
      targetType: 'ESTABLISHMENT', targetId: order.establishmentId || 1,
      targetName: 'L\'enseigne en général',
      rating: 5, comment: '', isLiked: null,
      submitted: false, reviewId: null, photoFile: null, photoPreview: null
    });

    // Avis produits/packs
    if (order.items) {
      order.items.forEach((item: any) => {
        this.reviewItems.push({
          targetType: item.itemType, targetId: item.itemId,
          targetName: item.itemName,
          rating: 5, comment: '', isLiked: null,
          submitted: false, reviewId: null, photoFile: null, photoPreview: null
        });
      });
    }
  }

  setRating(item: ReviewItem, r: number): void { item.rating = r; }

  setLike(item: ReviewItem, liked: boolean): void {
    item.isLiked = item.isLiked === liked ? null : liked;
  }

  onPhotoSelected(event: Event, item: ReviewItem): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;
    item.photoFile = file;
    const reader   = new FileReader();
    reader.onload  = (e) => {
      item.photoPreview = e.target?.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  removePhoto(item: ReviewItem): void {
    item.photoFile    = null;
    item.photoPreview = null;
  }

  submitAll(): void {
    if (this.isAnonymous && !this.guestName.trim()) {
      this.snackBar.open('Veuillez saisir votre prénom', '✕', { duration: 3000 });
      return;
    }

    this.submitting = true;
    const pending   = this.reviewItems.filter(i => !i.submitted);
    let completed   = 0;

    pending.forEach(item => {
      this.reviewSvc.createReview({
        orderId:     this.orderId,
        targetType:  item.targetType,
        targetId:    item.targetId,
        rating:      item.rating,
        comment:     item.comment || undefined,
        isLiked:     item.isLiked,
        guestName:   this.isAnonymous ? this.guestName.trim() : undefined,
      }).subscribe({
        next: (res) => {
          item.submitted = true;
          item.reviewId  = res.id;
          if (item.photoFile && res.id) {
            this.reviewSvc.uploadReviewPhoto(res.id, item.photoFile).subscribe();
          }
          completed++;
          if (completed === pending.length) {
            this.submitting = false;
            this.submitted  = true;
            this.cdr.detectChanges();
          }
        },
        error: () => {
          completed++;
          if (completed === pending.length) {
            this.submitting = false;
            this.cdr.detectChanges();
          }
        }
      });
    });
  }

  getTargetIcon(type: string): string {
    return type === 'ESTABLISHMENT' ? 'store' : type === 'PACK' ? 'layers' : 'inventory_2';
  }

  getTargetLabel(type: string): string {
    return type === 'ESTABLISHMENT' ? 'Enseigne' : type === 'PACK' ? 'Formule' : 'Produit';
  }

  getRatingLabel(r: number): string {
    const l = ['', 'Mauvais', 'Passable', 'Bien', 'Très bien', 'Excellent'];
    return l[r] || '';
  }
}
