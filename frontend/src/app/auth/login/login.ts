// src/app/auth/login/login.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';

declare var google: any;
declare var FB: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit {

  private readonly GOOGLE_CLIENT_ID = '880714273826-008hclp6kop4incg6lg4pv93bu7muid2.apps.googleusercontent.com';

  form = new FormGroup({
    email:    new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  loading       = false;
  socialLoading = false;
  error         = '';
  showPass      = false;

  private router      = inject(Router);
  private authService = inject(AuthService);

  get f() { return this.form.controls; }

  ngOnInit(): void {
    this.initGoogle();
    this.initFacebook();
  }

  // ── Google ────────────────────────────────────────────────────────

  private initGoogle(): void {
    const script  = document.createElement('script');
    script.src    = 'https://accounts.google.com/gsi/client';
    script.async  = true;
    script.onload = () => this.renderGoogleButton();
    document.head.appendChild(script);
  }

  renderGoogleButton(): void {
    if (typeof google === 'undefined') return;
    google.accounts.id.initialize({
      client_id:            this.GOOGLE_CLIENT_ID,
      callback:             (r: any) => this.handleGoogle(r),
      use_fedcm_for_prompt: false,
      auto_select:          false
    });
    const tryRender = () => {
      const btn = document.getElementById('google-login-btn');
      if (btn) {
        google.accounts.id.renderButton(btn, {
          theme: 'outline', size: 'large', width: 1
        });
      } else {
        setTimeout(tryRender, 200);
      }
    };
    tryRender();
  }

  loginWithGoogle(): void {
    const hidden = document.querySelector('#google-login-btn div[role="button"]') as HTMLElement;
    if (hidden) { hidden.click(); return; }
    if (typeof google !== 'undefined') google.accounts.id.prompt();
  }

  handleGoogle(response: any): void {
    this.socialLoading = true;
    this.error = '';
    this.authService.socialLogin('google', response.credential).subscribe({
      next: () => { this.socialLoading = false; this.router.navigate(['/dashboard']); },
      error: () => {
        this.socialLoading = false;
        this.error = 'Compte Google non autorisé sur cette plateforme.';
      }
    });
  }

  // ── Facebook ──────────────────────────────────────────────────────

  private initFacebook(): void {
    (window as any).fbAsyncInit = () => {
      FB.init({ appId: 'TON_FACEBOOK_APP_ID', cookie: true, xfbml: true, version: 'v18.0' });
    };
    const s = document.createElement('script');
    s.src   = 'https://connect.facebook.net/fr_FR/sdk.js';
    document.head.appendChild(s);
  }

  loginWithFacebook(): void {
    if (typeof FB === 'undefined') { this.error = 'SDK Facebook non disponible.'; return; }
    this.socialLoading = true;
    FB.login((r: any) => {
      if (r.authResponse) {
        this.authService.socialLogin('facebook', r.authResponse.accessToken).subscribe({
          next: () => { this.socialLoading = false; this.router.navigate(['/dashboard']); },
          error: () => {
            this.socialLoading = false;
            this.error = 'Compte Facebook non autorisé sur cette plateforme.';
          }
        });
      } else {
        this.socialLoading = false;
      }
    }, { scope: 'email,public_profile' });
  }

  // ── Email/Password ────────────────────────────────────────────────

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error   = '';
    this.authService.login(this.f.email.value!, this.f.password.value!).subscribe({
      next: () => { this.loading = false; this.router.navigate(['/dashboard']); },
      error: () => { this.loading = false; this.error = 'Identifiants incorrects ou serveur indisponible.'; }
    });
  }
}
