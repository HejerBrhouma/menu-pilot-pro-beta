// src/app/pages/dashboard/staff/staff.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject, NgZone } from '@angular/core';
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
import { MatChipsModule } from '@angular/material/chips';
import { UserService } from '../../../core/services/user.service';
import { EstablishmentService } from '../../../core/services/establishment.service';
import { ImpersonateService } from '../../../core/services/impersonate.service';
import { AuthService } from '../../../core/services/auth-service';
import { WaiterStatusService, StaffStatusEntry } from '../../../core/services/waiter-status.service';
import { AppUser, getRoleLabel, getRoleColor } from '../../../core/models/user.model';
import { Establishment } from '../../../core/models/establishment.model';
import { UserFormDialogComponent } from '../../super-admin/users/user-form-dialog/user-form-dialog.component';
import { ResetPasswordDialogComponent } from '../../super-admin/users/reset-password-dialog/reset-password-dialog.component';

interface StaffRow extends AppUser {
  liveStatus:        string | null;
  liveActivityLabel: string | null;
  liveUpdatedAt:     string | null;
  hasAlert:          boolean;
}

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: 'Disponible',
  BUSY:      'Occupé',
  BREAK:     'En pause',
  INACTIVE:  'Inactif',
  OFFLINE:   'Hors ligne',
};
const STATUS_COLOR: Record<string, string> = {
  AVAILABLE: '#10b981',
  BUSY:      '#6366f1',
  BREAK:     '#f59e0b',
  INACTIVE:  '#ef4444',
  OFFLINE:   '#9ca3af',
};

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatTableModule,
    MatSlideToggleModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatTooltipModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatChipsModule
  ],
  templateUrl: './staff.component.html',
  styleUrls: ['./staff.component.scss']
})
export class StaffComponent implements OnInit, OnDestroy {
  staff: StaffRow[]         = [];
  filteredStaff: StaffRow[] = [];
  establishment: Establishment | null = null;
  loading      = true;
  searchQuery  = '';

  canManage    = false;

  displayedColumns = ['user', 'role', 'liveStatus', 'status', 'actions'];

  getRoleLabel = getRoleLabel;
  getRoleColor = getRoleColor;
  statusLabel  = STATUS_LABEL;
  statusColor  = STATUS_COLOR;

  private mercureSource: EventSource | null = null;
  private mercureEstId: number | null = null;

  private userService          = inject(UserService);
  private establishmentService = inject(EstablishmentService);
  private impersonateService   = inject(ImpersonateService);
  private authService          = inject(AuthService);
  private waiterStatusSvc      = inject(WaiterStatusService);
  private dialog               = inject(MatDialog);
  private snackBar             = inject(MatSnackBar);
  private cdr                  = inject(ChangeDetectorRef);
  private zone                 = inject(NgZone);

  ngOnInit(): void {
    this.canManage = this.authService.canManage();
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.mercureSource) this.mercureSource.close();
  }

  loadData(): void {
    this.loading = true;
    this.establishmentService.getAll().subscribe({
      next: (ests) => {
        this.establishment = ests[0] || null;
        this.mercureEstId  = this.establishment?.id ?? null;

        this.userService.getAll().subscribe({
          next: (users: AppUser[]) => {
            const currentUser = this.authService.getCurrentUser();

            // Charger les statuts en direct puis fusionner
            this.waiterStatusSvc.getAllStatus().subscribe({
              next: (statuses) => {
                const statusMap = new Map<number, StaffStatusEntry>(
                  statuses.map(s => [s.userId, s])
                );

                this.staff = users
                  .filter(u => !u.roles.includes('ROLE_SUPER_ADMIN') && u.email !== currentUser?.email)
                  .map(u => this.buildRow(u, statusMap.get(u.id!) ?? null));

                this.applyFilters();
                this.loading = false;
                this.cdr.detectChanges();

                // Démarrer Mercure pour les mises à jour temps réel
                if (this.mercureEstId) this.connectMercure(this.mercureEstId);
              },
              error: () => {
                this.staff = users
                  .filter(u => !u.roles.includes('ROLE_SUPER_ADMIN') && u.email !== currentUser?.email)
                  .map(u => this.buildRow(u, null));

                this.applyFilters();
                this.loading = false;
                this.cdr.detectChanges();
                if (this.mercureEstId) this.connectMercure(this.mercureEstId);
              }
            });
          },
          error: () => { this.loading = false; this.cdr.detectChanges(); }
        });
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  private buildRow(u: AppUser, s: StaffStatusEntry | null): StaffRow {
    return {
      ...u,
      liveStatus:        s?.status        ?? 'OFFLINE',
      liveActivityLabel: s?.activityLabel ?? null,
      liveUpdatedAt:     s?.updatedAt     ?? null,
      hasAlert:          s?.activityLabel === 'ALERT_NO_RESPONSE',
    };
  }

  // ── Mercure ──────────────────────────────────────────────────────────

  private connectMercure(estId: number): void {
    if (this.mercureSource) { this.mercureSource.close(); this.mercureSource = null; }

    const source = this.waiterStatusSvc.subscribeToStaff(estId);
    this.mercureSource = source;

    source.onmessage = (event: MessageEvent) => {
      this.zone.run(() => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'STATUS_UPDATE') {
            this.applyStatusUpdate(data);
          }
        } catch {}
      });
    };
    source.onerror = () => {
      // Reconnexion automatique gérée par EventSource
    };
  }

  private applyStatusUpdate(data: any): void {
    const idx = this.staff.findIndex(s => s.id === data.userId);
    if (idx === -1) return;

    const updated: StaffRow = {
      ...this.staff[idx],
      liveStatus:        data.status,
      liveActivityLabel: data.activityLabel ?? null,
      liveUpdatedAt:     data.updatedAt     ?? null,
      hasAlert:          data.activityLabel === 'ALERT_NO_RESPONSE',
    };

    this.staff = [
      ...this.staff.slice(0, idx),
      updated,
      ...this.staff.slice(idx + 1),
    ];
    this.applyFilters();
    this.cdr.detectChanges();

    // Notification visuelle si alerte (US#4)
    if (updated.hasAlert) {
      this.snackBar.open(
        `⚠️ ${updated.firstName} ${updated.lastName} n'a pas répondu à la popup depuis 2 min`,
        '✕',
        { duration: 8000, panelClass: ['snack-error'] }
      );
    }
  }

  // ── Filters ──────────────────────────────────────────────────────────

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

  // ── Actions ──────────────────────────────────────────────────────────

  canImpersonate(user: AppUser): boolean {
    if (this.authService.isAdmin()) {
      return user.roles.includes('ROLE_MANAGER') || user.roles.includes('ROLE_WAITER');
    }
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
