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
import { EstablishmentService } from '../../../../core/services/establishment.service';
import { UserService } from '../../../../core/services/user.service';
import { ImpersonateService } from '../../../../core/services/impersonate.service';
import { Establishment } from '../../../../core/models/establishment.model';
import { AppUser } from '../../../../core/models/user.model';
import { EstablishmentFormDialogComponent } from '../establishment-form-dialog/establishment-form-dialog.component';

@Component({
  selector: 'app-establishments-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatIconModule, MatButtonModule,
    MatSlideToggleModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatTooltipModule, MatDialogModule
  ],
  templateUrl: './establishments-list.component.html',
  styleUrls: ['./establishments-list.component.scss']
})
export class EstablishmentsListComponent implements OnInit {
  establishments: Establishment[] = [];
  users: AppUser[] = [];
  loading = true;

  establishmentService = inject(EstablishmentService);
  private userService      = inject(UserService);
  private impersonateService = inject(ImpersonateService);
  private dialog           = inject(MatDialog);
  private snackBar         = inject(MatSnackBar);
  private cdr              = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.establishmentService.getAll().subscribe({
      next: (items: Establishment[]) => {
        this.establishments = items;
        // Charger les admins de chaque enseigne
        this.userService.getAll().subscribe({
          next: (users: AppUser[]) => {
            this.users = users;
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: () => { this.loading = false; this.cdr.detectChanges(); }
        });
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  // Retourne l'admin d'une enseigne (pour l'impersonation)
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

  openCreate(): void {
    const ref = this.dialog.open(EstablishmentFormDialogComponent, {
      width: '640px',
      data: { establishment: null }
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openEdit(est: Establishment): void {
    const ref = this.dialog.open(EstablishmentFormDialogComponent, {
      width: '640px',
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
