// src/app/pages/super-admin/users/users-list/users-list.component.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { MatSelectModule } from '@angular/material/select';
import { UserService } from '../../../../core/services/user.service';
import { EstablishmentService } from '../../../../core/services/establishment.service';
import { ImpersonateService } from '../../../../core/services/impersonate.service';
import { AuthService } from '../../../../core/services/auth-service';
import { AppUser, getRoleLabel, getRoleColor } from '../../../../core/models/user.model';
import { Establishment } from '../../../../core/models/establishment.model';
import { UserFormDialogComponent } from '../user-form-dialog/user-form-dialog.component';
import { ResetPasswordDialogComponent } from '../reset-password-dialog/reset-password-dialog.component';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatTableModule,
    MatSlideToggleModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatTooltipModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule
  ],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit {
  users: AppUser[]            = [];
  filteredUsers: AppUser[]    = [];
  establishments: Establishment[] = [];
  loading = true;

  displayedColumns = ['user', 'establishment', 'role', 'status', 'actions'];
  filterEstablishment = '';
  searchQuery = '';

  isSuperAdmin = false;
  isAdmin      = false;

  getRoleLabel = getRoleLabel;
  getRoleColor = getRoleColor;

  constructor(
    private userService: UserService,
    private establishmentService: EstablishmentService,
    private impersonateService: ImpersonateService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isSuperAdmin = this.authService.isSuperAdmin();
    this.isAdmin      = this.authService.isAdmin();
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.establishmentService.getAll().subscribe(ests => {
      this.establishments = ests;
      this.userService.getAll().subscribe({
        next: (users) => {
          this.users = users;
          this.applyFilters();
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => { this.loading = false; this.cdr.detectChanges(); }
      });
    });
  }

  applyFilters(): void {
    let result = [...this.users];
    if (this.filterEstablishment) {
      result = result.filter(u => u.establishment === this.filterEstablishment);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(u =>
        u.firstName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.lastName?.toLowerCase().includes(q) ?? false)
      );
    }
    this.filteredUsers = result;
  }

  getEstablishmentName(iri: string | undefined): string {
    if (!iri) return '—';
    const id = parseInt(iri.split('/').pop() || '0');
    return this.establishments.find(e => e.id === id)?.name || '—';
  }

  getUserCount(establishmentIri: string): number {
    return this.users.filter(u => u.establishment === establishmentIri).length;
  }

  /**
   * Vérifie si le bouton "Prendre la main" doit s'afficher pour un user donné
   * SUPER_ADMIN → peut prendre la main sur ROLE_ADMIN
   * ADMIN       → peut prendre la main sur ROLE_MANAGER ou ROLE_WAITER
   */
  canImpersonate(user: AppUser): boolean {
    if (this.isSuperAdmin) {
      return user.roles.includes('ROLE_ADMIN');
    }
    if (this.isAdmin) {
      return user.roles.includes('ROLE_MANAGER') || user.roles.includes('ROLE_WAITER');
    }
    return false;
  }

  impersonate(user: AppUser): void {
    if (!user.id) return;
    this.impersonateService.impersonateUser(user.id).subscribe({
      next: () => {}, // la redirection est gérée dans le service
      error: (err) => this.notify(err?.error?.error || err.message, 'error')
    });
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(UserFormDialogComponent, {
      width: '560px',
      data: { user: null, establishments: this.establishments }
    });
    ref.afterClosed().subscribe(result => { if (result) this.loadData(); });
  }

  openEditDialog(user: AppUser): void {
    const ref = this.dialog.open(UserFormDialogComponent, {
      width: '560px',
      data: { user, establishments: this.establishments }
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
          error: (err) => this.notify(err.message, 'error')
        });
      }
    });
  }

  toggleActive(user: AppUser): void {
    const newValue = !user.isActive;
    this.userService.toggleActive(user.id!, newValue).subscribe({
      next: (updated) => {
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users = [
            ...this.users.slice(0, index),
            { ...this.users[index], isActive: updated.isActive },
            ...this.users.slice(index + 1)
          ];
          this.applyFilters();
        }
        this.cdr.detectChanges();
        this.notify(newValue ? 'Utilisateur activé ✓' : 'Utilisateur désactivé');
      },
      error: (err) => this.notify(err.message, 'error')
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
