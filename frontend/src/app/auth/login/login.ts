import {Component, OnInit, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth-service';
import { Router } from '@angular/router';
/*
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  credentials = { username: '', password: '' };

  hidePassword = signal(true); // Pour masquer/afficher le mot de passe
  isLoading = signal(false);

  constructor(private authService: AuthService, private router: Router) {}

  togglePassword(event: MouseEvent) {
    this.hidePassword.set(!this.hidePassword());
    event.stopPropagation();
  }

  onLogin() {
    this.isLoading.set(true);
    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        this.router.navigate(['/import']);
      },
      error: (err) => {
        this.isLoading.set(false);
        alert('Identifiants incorrects');
      }
    });
  }
}*/

declare var google: any;
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit {
  credentials = { username: '', password: '' };

  loading = false;
  socialLoading = false;
  error = '';


private readonly GOOGLE_CLIENT_ID = '880714273826-008hclp6kop4incg6lg4pv93bu7muid2.apps.googleusercontent.com';

form = new FormGroup({
  email: new FormControl('', [Validators.required, Validators.email]),
  password: new FormControl('', [Validators.required]),
});

constructor(private router: Router, private authService: AuthService) {}

get f() {
  return this.form.controls;
}

ngOnInit(): void {
  this.initializeGoogleButton();
}

private initializeGoogleButton() {
  if (typeof google !== 'undefined' && google.accounts) {
    google.accounts.id.initialize({
      client_id: this.GOOGLE_CLIENT_ID,
      callback: (response: any) => this.handleGoogleCredentialResponse(response),
      use_fedcm_for_prompt: false, // Désactive FedCM pour éviter l'AbortError dans certains navigateurs
      auto_select: false
    });
  } else {
    console.warn("Le SDK Google n'est pas encore disponible. Vérifiez l'inclusion du script dans index.html");
  }
}

handleGoogleCredentialResponse(response: any) {
  this.socialLoading = true;
  this.error = '';

  const idToken = response.credential;

  this.authService.socialLogin('google', idToken).subscribe({
    next: () => {
      this.socialLoading = false;
      this.router.navigate(['/dashboard']);
    },
    error: (err) => {
      this.socialLoading = false;
      this.error = "L'authentification Google a échoué. Veuillez réessayer.";
      console.error('Social Login/Register Error:', err);
    }
  });
}

submit() {
  if (this.form.invalid) return;

  this.loading = true;
  this.error = '';

  this.authService.login(this.form.value.email!, this.form.value.password!).subscribe({
    next: () => {
      this.loading = false;
      this.router.navigate(['/dashboard']);
    },
    error: (err) => {
      this.loading = false;
      this.error = 'Identifiants incorrects ou serveur indisponible.';
    }
  });
}

loginWithSocial(provider: string) {
  if (provider === 'google') {
    if (typeof google !== 'undefined' && google.accounts) {
      try {
        google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {

            console.log('Le prompt Google n\'a pas pu s\'afficher:', notification.getNotDisplayedReason());
          }
        });
      } catch (e) {
        console.error('Erreur lors de l\'appel à prompt():', e);
        this.error = "Impossible d'ouvrir la fenêtre Google. Vérifiez vos bloqueurs de fenêtres surgissantes.";
      }
    } else {
      this.error = "Le service de connexion Google n'est pas encore chargé. Patientez un instant.";
    }
  } else {
    this.error = "Le support pour " + provider + " n'est pas encore implémenté.";
  }
}

  hidePassword = signal(true);
  isLoading = signal(false);


  togglePassword(event: MouseEvent) {
    this.hidePassword.set(!this.hidePassword());
    event.stopPropagation();
  }

  onLogin() {
    this.isLoading.set(true);

      this.authService.login(this.credentials.username, this.credentials.password).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        alert('Identifiants incorrects');
      }
    });
  }
}

