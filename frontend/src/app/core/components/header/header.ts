// src/app/core/components/header/header.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { EstablishmentService } from '../../services/establishment.service';
import { ImpersonationBannerComponent } from '../../../shared/impersonation-banner/impersonation-banner.component';
import { Establishment } from '../../models/establishment.model';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, RouterModule, RouterOutlet,
    MatSidenavModule, MatListModule, MatIconModule,
    MatButtonModule, MatTooltipModule, MatRippleModule,
    ImpersonationBannerComponent
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header implements OnInit {
  userName         = 'Admin';
  userInitial      = 'A';
  userRole         = 'Administrateur';
  hasNotifications = false;

  establishment: Establishment | null = null;
  logoUrl: string | null = null;

  constructor(
    private authService: AuthService,
    private establishmentService: EstablishmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    try {
      const user = this.authService.getCurrentUser?.();
      if (user) {
        this.userName    = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || 'Admin';
        this.userInitial = (user.firstName ?? user.email ?? 'A').charAt(0).toUpperCase();
        this.userRole    = this.getRoleLabel(user.roles);
      }
    } catch {}

    // Charger l'enseigne de l'user connecté
    this.establishmentService.getAll().subscribe({
      next: (items) => {
        if (items && items.length > 0) {
          this.establishment = items[0];
          if (this.establishment.logo) {
            this.logoUrl = this.establishmentService.getLogoUrl(this.establishment.logo);
          }
        }
      },
      error: () => {
        // Pas d'enseigne → logo Menu Pilot par défaut
        this.establishment = null;
        this.logoUrl = null;
      }
    });
  }

  private getRoleLabel(roles: string[]): string {
    if (roles?.includes('ROLE_SUPER_ADMIN')) return 'Super Admin';
    if (roles?.includes('ROLE_ADMIN'))       return 'Administrateur';
    if (roles?.includes('ROLE_MANAGER'))     return 'Manager';
    if (roles?.includes('ROLE_WAITER'))      return 'Serveur';
    return 'Utilisateur';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
