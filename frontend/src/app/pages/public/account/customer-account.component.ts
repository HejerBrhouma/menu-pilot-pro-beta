// src/app/pages/public/account/customer-account.component.ts

import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CustomerAuthService } from '../../../core/services/customer-auth.service';
import { ReviewService } from '../../../core/services/review.service';

type AccountTab = 'login' | 'register' | 'orders';

declare const google: any;
declare const FB: any;

@Component({
  selector: 'app-customer-account',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule,
    MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './customer-account.component.html',
  styleUrls: ['./customer-account.component.scss']
})
export class CustomerAccountComponent implements OnInit {
  tab:      AccountTab = 'login';
  loading   = false;
  showPass  = false;

  loginEmail    = '';
  loginPassword = '';
  regEmail      = '';
  regPassword   = '';
  regFirstName  = '';
  regLastName   = '';

  orders: any[] = [];

  // Édition profil
  editingProfile   = false;
  savingProfile    = false;
  showCurrentPass  = false;
  showNewPass      = false;
  editFirstName    = '';
  editLastName     = '';
  editCurrentPass  = '';
  editNewPass      = '';

  private router      = inject(Router);
  private authService = inject(CustomerAuthService);
  private reviewSvc   = inject(ReviewService);
  private snackBar    = inject(MatSnackBar);
  private cdr         = inject(ChangeDetectorRef);

  get customer() { return this.authService.currentCustomer; }
  get isLoggedIn() { return this.authService.isLoggedIn; }

  ngOnInit(): void {
    if (this.isLoggedIn) {
      this.tab = 'orders';
      this.loadOrders();
    }
    this.initGoogleOAuth();
    this.initFacebookSDK();
  }

  // ── Auth ──────────────────────────────────────────────────────────

  login(): void {
    if (!this.loginEmail || !this.loginPassword) return;
    this.loading = true;
    this.authService.login({ email: this.loginEmail, password: this.loginPassword }).subscribe({
      next: () => {
        this.loading = false;
        this.tab = 'orders';
        this.loadOrders();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.error || 'Identifiants incorrects', '✕', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  register(): void {
    if (!this.regEmail || !this.regPassword) return;
    this.loading = true;
    this.authService.register({
      email: this.regEmail, password: this.regPassword,
      firstName: this.regFirstName, lastName: this.regLastName
    }).subscribe({
      next: () => {
        this.loading = false;
        this.tab = 'orders';
        this.snackBar.open('Bienvenue ! Compte créé ✓', '✕', {
          duration: 3000, panelClass: ['snack-success']
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.error || 'Erreur inscription', '✕', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.tab    = 'login';
    this.orders = [];
    this.cdr.detectChanges();
  }

  // ── OAuth ─────────────────────────────────────────────────────────

  initGoogleOAuth(): void {
    const script  = document.createElement('script');
    script.src    = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
          client_id: 'TON_GOOGLE_CLIENT_ID',
          callback:  (r: any) => this.handleGoogle(r)
        });
        const btn = document.getElementById('google-signin-btn');
        if (btn) google.accounts.id.renderButton(btn,
          { theme: 'outline', size: 'large', width: 340, text: 'continue_with' });
      }
    };
    document.head.appendChild(script);
  }

  handleGoogle(response: any): void {
    this.loading = true;
    this.authService.loginWithGoogle(response.credential).subscribe({
      next: () => { this.loading = false; this.tab = 'orders'; this.loadOrders(); this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.snackBar.open('Erreur Google', '✕', { duration: 3000 }); this.cdr.detectChanges(); }
    });
  }

  initFacebookSDK(): void {
    (window as any).fbAsyncInit = () => {
      FB.init({ appId: 'TON_FACEBOOK_APP_ID', cookie: true, xfbml: true, version: 'v18.0' });
    };
    const s = document.createElement('script');
    s.src   = 'https://connect.facebook.net/fr_FR/sdk.js';
    document.head.appendChild(s);
  }

  loginWithFacebook(): void {
    FB.login((r: any) => {
      if (r.authResponse) {
        this.loading = true;
        this.authService.loginWithFacebook(r.authResponse.accessToken).subscribe({
          next: () => { this.loading = false; this.tab = 'orders'; this.loadOrders(); this.cdr.detectChanges(); },
          error: () => { this.loading = false; this.snackBar.open('Erreur Facebook', '✕', { duration: 3000 }); this.cdr.detectChanges(); }
        });
      }
    }, { scope: 'email,public_profile' });
  }

  // ── Commandes ─────────────────────────────────────────────────────

  loadOrders(): void {
    this.reviewSvc.getCustomerOrders().subscribe({
      next: (o) => { this.orders = o; this.cdr.detectChanges(); },
      error: (err) => {
        this.snackBar.open('Erreur chargement commandes : ' + (err.status || ''), '✕', { duration: 4000 });
        this.cdr.detectChanges();
      }
    });
  }

  openEditProfile(): void {
    this.editFirstName   = this.customer?.firstName || '';
    this.editLastName    = this.customer?.lastName  || '';
    this.editCurrentPass = '';
    this.editNewPass     = '';
    this.editingProfile  = true;
  }

  cancelEditProfile(): void {
    this.editingProfile = false;
  }

  saveProfile(): void {
    if (!this.editFirstName.trim()) {
      this.snackBar.open('Le prénom est requis', '✕', { duration: 3000 });
      return;
    }

    this.savingProfile = true;

    const payload: any = {
      firstName: this.editFirstName.trim(),
      lastName:  this.editLastName.trim(),
    };

    if (this.editNewPass) {
      payload.currentPassword = this.editCurrentPass;
      payload.newPassword     = this.editNewPass;
    }

    this.authService.updateProfile(payload).subscribe({
      next: () => {
        this.savingProfile  = false;
        this.editingProfile = false;
        this.snackBar.open('Profil mis à jour ✓', '✕', { duration: 3000, panelClass: ['snack-success'] });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.savingProfile = false;
        this.snackBar.open(err.error?.error || 'Erreur lors de la mise à jour', '✕', { duration: 3500 });
        this.cdr.detectChanges();
      }
    });
  }

  goToReview(orderId: number): void {
    this.router.navigate(['/account/review', orderId]);
  }

  getStatusLabel(s: string): string {
    const l: Record<string, string> = {
      PENDING: 'En attente', CONFIRMED: 'Confirmée',
      SERVED: 'Servie', PAID: 'Payée', CANCELLED: 'Annulée'
    };
    return l[s] || s;
  }

  getStatusColor(s: string): string {
    const c: Record<string, string> = {
      PENDING: '#f59e0b', CONFIRMED: '#6366f1',
      SERVED: '#10b981', PAID: '#059669', CANCELLED: '#ef4444'
    };
    return c[s] || '#9ca3af';
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
