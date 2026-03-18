// src/app/pages/dashboard/staff/staff.component.ts

import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UserService } from '../../../core/services/user.service';
import { EstablishmentService } from '../../../core/services/establishment.service';
import { ImpersonateService } from '../../../core/services/impersonate.service';
import { AuthService } from '../../../core/services/auth-service';
import { AppUser, getRoleLabel, getRoleColor } from '../../../core/models/user.model';
import { Establishment } from '../../../core/models/establishment.model';
import { UserFormDialogComponent } from '../../super-admin/users/user-form-dialog/user-form-dialog.component';
import { ResetPasswordDialogComponent } from '../../super-admin/users/reset-password-dialog/reset-password-dialog.component';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatTableModule,
    MatSlideToggleModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatTooltipModule, MatDialogModule,
    MatFormFieldModule, MatInputModule
  ],
  templateUrl: './staff.component.html',
  styleUrls: ['./staff.component.scss']
})
export class StaffComponent implements OnInit {
  staff: AppUser[]         = [];
  filteredStaff: AppUser[] = [];
  establishment: Establishment | null = null;
  loading      = true;
  searchQuery  = '';

  // Droits selon le rôle
  canManage    = false;

  displayedColumns = ['user', 'role', 'status', 'actions'];

  getRoleLabel = getRoleLabel;
  getRoleColor = getRoleColor;

  private userService          = inject(UserService);
  private establishmentService = inject(EstablishmentService);
  private impersonateService   = inject(ImpersonateService);
  private authService          = inject(AuthService);
  private dialog               = inject(MatDialog);
  private snackBar             = inject(MatSnackBar);
  private cdr                  = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.canManage = this.authService.canManage();
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.establishmentService.getAll().subscribe({
      next: (ests) => {
        this.establishment = ests[0] || null;
        this.userService.getAll().subscribe({
          next: (users: AppUser[]) => {
            const currentUser = this.authService.getCurrentUser();
            this.staff = users.filter(u =>
              !u.roles.includes('ROLE_SUPER_ADMIN') &&
              u.email !== currentUser?.email
            );
            this.applyFilters();
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: () => { this.loading = false; this.cdr.detectChanges(); }
        });
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  applyFilters(): void {
    if (!this.searchQuery) {
      this.filteredStaff = [...this.staff];
      return;
    }
    const q = this.searchQuery.toLowerCase();
    this.filteredStaff = this.staff.filter(u =>
      u.firstName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.lastName?.toLowerCase().includes(q) ?? false)
    );
  }

  canImpersonate(user: AppUser): boolean {
    // ADMIN peut prendre la main sur MANAGER et WAITER
    if (this.authService.isAdmin()) {
      return user.roles.includes('ROLE_MANAGER') || user.roles.includes('ROLE_WAITER');
    }
    // MANAGER peut prendre la main sur WAITER uniquement
    if (this.authService.isManager()) {
      return user.roles.includes('ROLE_WAITER');
    }
    return false;
  }

  impersonate(user: AppUser): void {
    if (!user.id) return;
    this.impersonateService.impersonateUser(user.id).subscribe({
      next: () => {},
      error: (err: any) => this.notify(err?.error?.error || 'Erreur impersonation', 'error')
    });
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(UserFormDialogComponent, {
      width: '560px',
      data: {
        user: null,
        establishments: this.establishment ? [this.establishment] : [],
        lockEstablishment: true
      }
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openEditDialog(user: AppUser): void {
    const ref = this.dialog.open(UserFormDialogComponent, {
      width: '560px',
      data: {
        user,
        establishments: this.establishment ? [this.establishment] : [],
        lockEstablishment: true
      }
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openResetPassword(user: AppUser): void {
    const ref = this.dialog.open(ResetPasswordDialogComponent, {
      width: '420px',
      data: { user }
    });
    ref.afterClosed().subscribe(newPwd => {
      if (newPwd) {
        this.userService.resetPassword(user.id!, newPwd).subscribe({
          next: () => this.notify('Mot de passe réinitialisé ✓'),
          error: (err: any) => this.notify(err.message, 'error')
        });
      }
    });
  }

  toggleActive(user: AppUser): void {
    this.userService.toggleActive(user.id!, !user.isActive).subscribe({
      next: (updated: AppUser) => {
        const i = this.staff.findIndex(u => u.id === user.id);
        if (i !== -1) {
          this.staff = [
            ...this.staff.slice(0, i),
            { ...this.staff[i], isActive: updated.isActive },
            ...this.staff.slice(i + 1)
          ];
          this.applyFilters();
        }
        this.cdr.detectChanges();
        this.notify(updated.isActive ? 'Activé ✓' : 'Désactivé');
      },
      error: (err: any) => this.notify(err.message, 'error')
    });
  }

  private notify(msg: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(msg, '✕', {
      duration: 3500,
      panelClass: type === 'error' ? ['snack-error'] : ['snack-success'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}
