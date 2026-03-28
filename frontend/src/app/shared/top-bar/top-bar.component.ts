// src/app/shared/top-bar/top-bar.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../core/services/auth-service';
import { CustomerAuthService } from '../../core/services/customer-auth.service';
import { EstablishmentService } from '../../core/services/establishment.service';
import { OrderService } from '../../core/services/order.service';
import { ReviewService } from '../../core/services/review.service';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatMenuModule, MatDividerModule
  ],
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.scss']
})
export class TopBarComponent implements OnInit, OnDestroy {
  visible            = false;
  isAdmin            = false;
  isSuperAdmin       = false;
  isCustomer         = false;

  pendingOrdersCount  = 0;
  pendingReviewsCount = 0;

  adminName         = '';
  adminInitial      = 'A';
  adminRole         = '';
  customerName      = '';
  customerInitial   = 'C';

  /** Logo à afficher dans la topbar */
  establishmentName = '';
  establishmentLogo : string | null = null;   // URL complète du logo enseigne

  private routerSub    : Subscription | null = null;
  private refreshTimer : any = null;

  private router             = inject(Router);
  private authService        = inject(AuthService);
  private customerAuth       = inject(CustomerAuthService);
  private establishmentSvc   = inject(EstablishmentService);
  private orderService       = inject(OrderService);
  private reviewService      = inject(ReviewService);
  private cdr                = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.checkState(this.router.url);
    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => this.checkState(e.urlAfterRedirects || e.url));
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    if (this.refreshTimer) { clearInterval(this.refreshTimer); }
  }

  private checkState(url: string): void {
    this.visible     = !url.startsWith('/login');
    this.isAdmin     = this.authService.isLoggedIn();
    this.isSuperAdmin = this.isAdmin && (this.authService.getCurrentUser()?.roles ?? []).includes('ROLE_SUPER_ADMIN');
    this.isCustomer  = !this.isAdmin && this.customerAuth.isLoggedIn;

    if (this.isAdmin && !this.isSuperAdmin) {
      const user = this.authService.getCurrentUser();
      this.adminName    = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || user?.email || 'Admin';
      this.adminInitial = (user?.firstName ?? user?.email ?? 'A').charAt(0).toUpperCase();
      this.adminRole    = this.getRoleLabel(user?.roles ?? []);
      this.loadEstablishment();
      this.loadAdminCounts();
      if (!this.refreshTimer) {
        this.refreshTimer = setInterval(() => this.loadAdminCounts(), 60_000);
      }
    }

    if (this.isSuperAdmin) {
      const user = this.authService.getCurrentUser();
      this.adminName    = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || user?.email || 'Super Admin';
      this.adminInitial = (user?.firstName ?? user?.email ?? 'S').charAt(0).toUpperCase();
      this.adminRole    = 'Super Admin';
      this.establishmentLogo = null;
      this.establishmentName = 'Menu Pilot Pro';
    }

    if (this.isCustomer) {
      const c = this.customerAuth.currentCustomer;
      this.customerName    = c?.fullName || c?.firstName || '';
      this.customerInitial = (c?.firstName ?? 'C').charAt(0).toUpperCase();
      this.establishmentLogo = null;
      this.establishmentName = 'Menu Pilot Pro';
    }

    this.cdr.detectChanges();
  }

  private loadEstablishment(): void {
    this.establishmentSvc.getAll().subscribe({
      next: (items) => {
        if (items?.length > 0) {
          const e = items[0];
          this.establishmentName = e.name || 'Menu Pilot Pro';
          this.establishmentLogo = e.logo ? this.establishmentSvc.getLogoUrl(e.logo) : null;
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  private loadAdminCounts(): void {
    this.orderService.getAll({ status: 'PENDING' }).subscribe({
      next: (orders) => { this.pendingOrdersCount = orders.length; this.cdr.detectChanges(); },
      error: () => {}
    });
    this.reviewService.getPendingReviews().subscribe({
      next: (reviews) => { this.pendingReviewsCount = reviews.length; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  private getRoleLabel(roles: string[]): string {
    if (roles.includes('ROLE_SUPER_ADMIN')) return 'Super Admin';
    if (roles.includes('ROLE_ADMIN'))       return 'Administrateur';
    if (roles.includes('ROLE_MANAGER'))     return 'Manager';
    if (roles.includes('ROLE_WAITER'))      return 'Serveur';
    return '';
  }

  goToProfile(): void {
    if (this.isSuperAdmin) {
      this.router.navigate(['/super-admin/dashboard']);
    } else {
      this.router.navigate(['/establishment']);
    }
  }

  logoutAdmin(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  logoutCustomer(): void {
    this.customerAuth.logout();
    this.isCustomer   = false;
    this.cdr.detectChanges();
  }
}
