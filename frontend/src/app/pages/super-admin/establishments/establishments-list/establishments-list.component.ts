// src/app/pages/super-admin/establishments/establishments-list/establishments-list.component.ts

import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EstablishmentService } from '../../../../core/services/establishment.service';
import { UserService } from '../../../../core/services/user.service';
import { ImpersonateService } from '../../../../core/services/impersonate.service';
import { ReviewService } from '../../../../core/services/review.service';
import { Establishment } from '../../../../core/models/establishment.model';
import { AppUser } from '../../../../core/models/user.model';
import { EstablishmentFormDialogComponent } from '../establishment-form-dialog/establishment-form-dialog.component';

@Component({
  selector: 'app-establishments-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatIconModule, MatButtonModule,
    MatSlideToggleModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatTooltipModule, MatDialogModule
  ],
  templateUrl: './establishments-list.component.html',
  styleUrls: ['./establishments-list.component.scss']
})
export class EstablishmentsListComponent implements OnInit {
  establishments: Establishment[] = [];
  filteredEstablishments: Establishment[] = [];
  users: AppUser[] = [];
  ratings: Record<number, { avg: number; count: number }> = {};
  loading = true;
  searchQuery = '';

  establishmentService = inject(EstablishmentService);
  private userService        = inject(UserService);
  private impersonateService = inject(ImpersonateService);
  private reviewService      = inject(ReviewService);
  private dialog             = inject(MatDialog);
  private snackBar           = inject(MatSnackBar);
  private cdr                = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.establishmentService.getAll().subscribe({
      next: (items: Establishment[]) => {
        this.establishments = items;
        this.applySearch();

        this.userService.getAll().subscribe({
          next: (users: AppUser[]) => {
            this.users = users;
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: () => { this.loading = false; this.cdr.detectChanges(); }
        });

        // Load ratings for each establishment in parallel
        if (items.length > 0) {
          const calls = items.map(est =>
            this.reviewService.getReviews('establishment', est.id!).pipe(
              catchError(() => of({ reviews: [], count: 0, avgRating: 0 }))
            )
          );
          forkJoin(calls).subscribe(results => {
            items.forEach((est, i) => {
              this.ratings[est.id!] = { avg: results[i].avgRating, count: results[i].count };
            });
            this.cdr.detectChanges();
          });
        }
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  applySearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredEstablishments = q
      ? this.establishments.filter(e =>
          e.name.toLowerCase().includes(q) ||
          (e.city?.toLowerCase().includes(q) ?? false) ||
          e.slug.toLowerCase().includes(q)
        )
      : [...this.establishments];
  }

  // ── Helpers ──

  getAdmin(est: Establishment): AppUser | null {
    return this.users.find(u =>
      u.establishment === `/api/establishments/${est.id}` &&
      u.roles.includes('ROLE_ADMIN')
    ) || null;
  }

  getUserCount(est: Establishment): number {
    return this.users.filter(u =>
      u.establishment === `/api/establishments/${est.id}`
    ).length;
  }

  getAvgRating(estId: number): number {
    return this.ratings[estId]?.avg ?? 0;
  }

  getReviewCount(estId: number): number {
    return this.ratings[estId]?.count ?? 0;
  }

  getStarIcon(estId: number, pos: number): string {
    const avg = this.getAvgRating(estId);
    if (avg >= pos)       return 'star';
    if (avg >= pos - 0.5) return 'star_half';
    return 'star_border';
  }

  // ── Actions ──

  openCreate(): void {
    const ref = this.dialog.open(EstablishmentFormDialogComponent, {
      width: '660px',
      maxWidth: '95vw',
      data: { establishment: null }
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openEdit(est: Establishment): void {
    const ref = this.dialog.open(EstablishmentFormDialogComponent, {
      width: '660px',
      maxWidth: '95vw',
      data: { establishment: est }
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  impersonateAdmin(est: Establishment): void {
    const admin = this.getAdmin(est);
    if (!admin?.id) {
      this.snackBar.open('Aucun admin trouvé pour cette enseigne', '✕', { duration: 3000 });
      return;
    }
    this.impersonateService.impersonateUser(admin.id).subscribe({
      next: () => {},
      error: (err: any) => this.snackBar.open(err?.error?.error || 'Erreur impersonation', '✕', { duration: 3000 })
    });
  }

  toggleActive(est: Establishment): void {
    if (!est.id) return;
    this.establishmentService.update(est.id, { isActive: !est.isActive }).subscribe({
      next: (updated: Establishment) => {
        const index = this.establishments.findIndex(e => e.id === est.id);
        if (index !== -1) {
          this.establishments = [
            ...this.establishments.slice(0, index),
            { ...this.establishments[index], isActive: updated.isActive },
            ...this.establishments.slice(index + 1)
          ];
          this.applySearch();
        }
        this.cdr.detectChanges();
        this.snackBar.open(
          updated.isActive ? 'Enseigne activée ✓' : 'Enseigne désactivée',
          '✕', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' }
        );
      }
    });
  }
}
