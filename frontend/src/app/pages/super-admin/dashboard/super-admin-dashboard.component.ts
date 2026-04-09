// src/app/pages/super-admin/dashboard/super-admin-dashboard.component.ts

import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EstablishmentService } from '../../../core/services/establishment.service';
import { UserService } from '../../../core/services/user.service';
import { ReviewService } from '../../../core/services/review.service';
import { OrderService } from '../../../core/services/order.service';
import { Establishment } from '../../../core/models/establishment.model';
import { AppUser } from '../../../core/models/user.model';

export interface EstStat {
  est:         Establishment;
  staffCount:  number;
  reviewCount: number;
  avgRating:   number;
  revenue:     number;
}

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatTooltipModule
  ],
  templateUrl: './super-admin-dashboard.component.html',
  styleUrls:  ['./super-admin-dashboard.component.scss']
})
export class SuperAdminDashboardComponent implements OnInit {
  loading = true;
  today   = new Date();

  // Raw data
  establishments: Establishment[] = [];
  users: AppUser[] = [];

  // Per-establishment enriched stats (sorted by revenue desc)
  estStats: EstStat[] = [];

  // Global KPIs
  totalEstablishments   = 0;
  activeEstablishments  = 0;
  totalUsers            = 0;
  activeUsers           = 0;
  totalReviews          = 0;
  avgGlobalRating       = 0;
  totalRevenue          = 0;
  maxRevenue            = 0;   // for progress-bar scaling

  // Top performers
  topByRevenue: EstStat | null = null;
  topByReviews: EstStat | null = null;
  topByRating:  EstStat | null = null;

  private estService    = inject(EstablishmentService);
  private userService   = inject(UserService);
  private reviewService = inject(ReviewService);
  private orderService  = inject(OrderService);
  private cdr           = inject(ChangeDetectorRef);

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading = true;

    forkJoin({
      establishments: this.estService.getAll().pipe(catchError(() => of([]))),
      users:          this.userService.getAll().pipe(catchError(() => of([]))),
      invoices:       this.orderService.getInvoices().pipe(catchError(() => of([]))),
    }).subscribe(({ establishments, users, invoices }) => {

      this.establishments = establishments as Establishment[];
      this.users          = users as AppUser[];

      // ── Global KPIs ──────────────────────────────────────────────────
      this.totalEstablishments  = this.establishments.length;
      this.activeEstablishments = this.establishments.filter(e => e.isActive).length;
      this.totalUsers           = this.users.length;
      this.activeUsers          = this.users.filter(u => u.isActive).length;

      // Revenue per establishment from invoices (PAID, today only)
      const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
      const revenueMap: Record<number, number> = {};
      (invoices as any[])
        .filter(inv => inv.status === 'PAID' && inv.createdAt?.slice(0, 10) === todayStr)
        .forEach(inv => {
          const estId = this.extractEstId(inv.establishment);
          if (estId) revenueMap[estId] = (revenueMap[estId] || 0) + (inv.total || 0);
        });
      this.totalRevenue = Object.values(revenueMap).reduce((a, b) => a + b, 0);

      // ── Load ratings ──────────────────────────────────────────────────
      if (this.establishments.length === 0) {
        this.loading = false;
        this.cdr.detectChanges();
        return;
      }

      const ratingCalls = this.establishments.map(e =>
        this.reviewService.getReviews('establishment', e.id!).pipe(
          catchError(() => of({ reviews: [], count: 0, avgRating: 0 }))
        )
      );

      forkJoin(ratingCalls).subscribe(ratings => {
        this.estStats = this.establishments.map((est, i) => ({
          est,
          staffCount:  this.users.filter(u => u.establishment === `/api/establishments/${est.id}`).length,
          reviewCount: (ratings[i] as any).count     || 0,
          avgRating:   (ratings[i] as any).avgRating || 0,
          revenue:     revenueMap[est.id!] || 0,
        }));

        // Global derived KPIs
        this.totalReviews = this.estStats.reduce((s, e) => s + e.reviewCount, 0);
        const ratedStats  = this.estStats.filter(e => e.reviewCount > 0);
        this.avgGlobalRating = ratedStats.length > 0
          ? ratedStats.reduce((s, e) => s + e.avgRating, 0) / ratedStats.length
          : 0;

        // Max revenue (for progress bar scaling)
        this.maxRevenue = Math.max(...this.estStats.map(e => e.revenue), 1);

        // Sort table by revenue desc
        this.estStats.sort((a, b) => b.revenue - a.revenue);

        // Top performers
        this.topByRevenue = this.estStats[0] || null;
        this.topByReviews = [...this.estStats].sort((a, b) => b.reviewCount - a.reviewCount)[0] || null;
        this.topByRating  = ratedStats.length > 0
          ? [...ratedStats].sort((a, b) => b.avgRating - a.avgRating)[0]
          : null;

        this.loading = false;
        this.cdr.detectChanges();
      });
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  getStarIcon(rating: number, pos: number): string {
    if (rating >= pos)       return 'star';
    if (rating >= pos - 0.5) return 'star_half';
    return 'star_border';
  }

  getRevenueBar(revenue: number): number {
    return this.maxRevenue > 0 ? Math.round((revenue / this.maxRevenue) * 100) : 0;
  }

  getLogoUrl(logo: string | undefined): string {
    return this.estService.getLogoUrl(logo);
  }

  getRankBadge(index: number): string {
    return ['🥇', '🥈', '🥉'][index] ?? `${index + 1}`;
  }

  private extractEstId(establishment: any): number | null {
    if (!establishment) return null;
    if (typeof establishment === 'number') return establishment;
    if (typeof establishment === 'string') {
      return parseInt(establishment.split('/').pop() || '0') || null;
    }
    if (establishment['@id']) {
      return parseInt(establishment['@id'].split('/').pop() || '0') || null;
    }
    return establishment.id ?? null;
  }
}
