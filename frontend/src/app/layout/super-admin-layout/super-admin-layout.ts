// src/app/layout/super-admin-layout/super-admin-layout.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth-service';
import { User } from '../../core/models/auth.model';

@Component({
  selector: 'app-super-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  template: `
    <div class="sa-shell">
      <aside class="sa-sidebar">
        <nav class="sa-nav" style="padding-top:1.25rem">
          <a routerLink="/super-admin/dashboard" routerLinkActive="active" class="sa-nav-item">
            <mat-icon>dashboard</mat-icon><span>Dashboard</span>
          </a>
          <a routerLink="/super-admin/establishments" routerLinkActive="active" class="sa-nav-item">
            <mat-icon>store</mat-icon><span>Enseignes</span>
          </a>
          <a routerLink="/super-admin/users" routerLinkActive="active" class="sa-nav-item">
            <mat-icon>group</mat-icon><span>Utilisateurs</span>
          </a>
        </nav>
        <div class="sa-sidebar-footer">
          <button class="sa-nav-item logout" (click)="logout()">
            <mat-icon>logout</mat-icon><span>Déconnexion</span>
          </button>
        </div>
      </aside>
      <main class="sa-main">
        <div class="sa-content">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .sa-shell { display:flex; min-height:calc(100vh - 56px); margin-top:56px; background:#f1f5f9; }
    .sa-sidebar { width:240px; flex-shrink:0; background:#0f1629; display:flex; flex-direction:column; position:sticky; top:56px; height:calc(100vh - 56px); }
.sa-nav { flex:1; padding:1rem 0.75rem; display:flex; flex-direction:column; gap:4px; }
    .sa-nav-item { display:flex; align-items:center; gap:10px; padding:0.625rem 0.875rem; border-radius:10px; color:#94a3b8; font-size:0.875rem; font-weight:500; text-decoration:none; cursor:pointer; border:none; background:none; width:100%; text-align:left; transition:all 0.15s; }
    .sa-nav-item mat-icon { font-size:1.1rem; width:1.1rem; height:1.1rem; }
    .sa-nav-item:hover { background:rgba(255,255,255,0.06); color:white; }
    .sa-nav-item.active { background:rgba(245,158,11,0.15); color:#f59e0b; }
    .sa-nav-item.logout { color:#ef4444; }
    .sa-nav-item.logout:hover { background:rgba(239,68,68,0.1); }
    .sa-sidebar-footer { padding:0.75rem; border-top:1px solid rgba(255,255,255,0.08); }
    .sa-main { flex:1; display:flex; flex-direction:column; overflow:hidden; }
    .sa-content { flex:1; overflow-y:auto; }
  `]
})
export class SuperAdminLayout implements OnInit {
  user: User | null = null;  // ← déclaré sans initialisation immédiate

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();  // ← assigné dans ngOnInit
  }

  logout(): void { this.authService.logout(); }
}
