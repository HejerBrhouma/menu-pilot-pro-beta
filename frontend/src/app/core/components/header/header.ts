// src/app/core/components/header/header.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';

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
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatRippleModule
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header implements OnInit {
  userName = 'Admin';
  userInitial = 'A';
  hasNotifications = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Récupère les infos user si dispo depuis authService
    try {
      const user = this.authService.getCurrentUser?.();
      if (user) {
        this.userName = user.firstName ?? user.email ?? 'Admin';
        this.userInitial = this.userName.charAt(0).toUpperCase();
      }
    } catch {}
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
