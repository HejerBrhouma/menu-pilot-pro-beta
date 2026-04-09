// src/app/core/components/header/header.ts

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth-service';
import { EstablishmentService } from '../../services/establishment.service';
import { PromotionService } from '../../services/promotion.service';
import { OrderService } from '../../services/order.service';
import { InactivityService } from '../../services/inactivity.service';
import { WaiterActivityService } from '../../services/waiter-activity.service';
import { WaiterStatusService } from '../../services/waiter-status.service';
import { NotificationAdminService } from '../../services/notification-admin.service';
import { ImpersonationBannerComponent } from '../../../shared/impersonation-banner/impersonation-banner.component';
import { PromoConflictBannerComponent } from '../../../shared/promo-conflict-banner/promo-conflict-banner.component';
import { InactivityDialogComponent, ActivityResult } from '../../../shared/inactivity-dialog/inactivity-dialog.component';
import { Establishment } from '../../models/establishment.model';
import { ThemeService } from '../../services/theme.service';
import { PermissionService } from '../../services/permission.service';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, RouterModule, RouterOutlet,
    MatSidenavModule, MatListModule, MatIconModule,
    MatButtonModule, MatTooltipModule, MatRippleModule,
    MatDialogModule, MatSnackBarModule,
    ImpersonationBannerComponent,
    PromoConflictBannerComponent
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header implements OnInit, OnDestroy {
  userName           = 'Admin';
  userInitial        = 'A';
  userRole           = 'Administrateur';
  hasNotifications   = false;
  hasPromoConflicts  = false;
  pendingOrdersCount = 0;

  establishment: Establishment | null = null;
  logoUrl: string | null = null;
  isWaiter = false;

  // Inactivité : minutes depuis la dernière action (affiché dans la popup)
  unreadNotifCount = 0;

  private inactivitySub:  Subscription | null = null;
  private inactivityStartMs = 0;
  private popupOpenMs       = 0;
  private alertTimer:       any = null;
  private mercureNotif:     EventSource | null = null;

  constructor(
    private authService:          AuthService,
    private establishmentService: EstablishmentService,
    private promotionService:     PromotionService,
    private orderService:         OrderService,
    private inactivitySvc:        InactivityService,
    private waiterActivitySvc:    WaiterActivityService,
    private waiterStatusSvc:      WaiterStatusService,
    private notificationAdminSvc: NotificationAdminService,
    private dialog:               MatDialog,
    private snackBar:             MatSnackBar,
    private router:               Router,
    private cdr:                  ChangeDetectorRef,
    private themeService:         ThemeService,
    private permissionService:    PermissionService
  ) {}

  ngOnInit(): void {
    try {
      const user = this.authService.getCurrentUser?.();
      if (user) {
        this.userName    = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || 'Admin';
        this.userInitial = (user.firstName ?? user.email ?? 'A').charAt(0).toUpperCase();
        this.userRole    = this.getRoleLabel(user.roles);
        this.isWaiter    = this.authService.isWaiter();
      }
    } catch {}

    // Détection d'inactivité — TEST : inclut manager, remettre isWaiter en prod
    if (this.isWaiter || this.authService.isManager()) {
      // Publier statut AVAILABLE à la connexion
      this.waiterStatusSvc.updateStatus('AVAILABLE').subscribe({ error: () => {} });

      this.inactivityStartMs = Date.now();
      this.inactivitySvc.start(0.5); // TEST : 30 secondes (remettre 10 en prod)
      this.inactivitySub = this.inactivitySvc.inactivityDetected$.subscribe(() => {
        const elapsedMin = Math.round((Date.now() - this.inactivityStartMs) / 60000);
        this.openInactivityDialog(elapsedMin);
      });
    }

    // Logo enseigne + application du thème couleurs
    this.establishmentService.getAll().subscribe({
      next: (items) => {
        if (items?.length > 0) {
          this.establishment = items[0];
          if (this.establishment.logo) {
            this.logoUrl = this.establishmentService.getLogoUrl(this.establishment.logo);
          }
          // Appliquer le thème de l'enseigne sur toute l'interface
          if (this.establishment.primaryColor || this.establishment.secondaryColor) {
            this.themeService.apply(
              this.establishment.primaryColor ?? '#6366f1',
              this.establishment.secondaryColor ?? '#8b5cf6'
            );
          }
          this.permissionService.loadFromEstablishment(this.establishment!);
          this.cdr.detectChanges();
        }
      }
    });

    // Notifications non lues (admin/manager uniquement)
    if (!this.isWaiter) {
      this.loadUnreadCount();
      this.establishmentService.getAll().subscribe({
        next: (items) => {
          if (items?.length > 0) {
            this.connectNotifMercure(items[0].id!);
          }
        }
      });
    }

    // Conflits promos → badge orange
    this.promotionService.getUnresolvedConflicts().subscribe({
      next: (conflicts) => {
        this.hasPromoConflicts = conflicts.length > 0;
        this.cdr.detectChanges();
      },
      error: () => { this.hasPromoConflicts = false; }
    });

    // Commandes en attente → point rouge
    this.orderService.getAll({ status: 'PENDING' }).subscribe({
      next: (orders) => {
        this.pendingOrdersCount = orders.length;
        this.cdr.detectChanges();
      },
      error: () => { this.pendingOrdersCount = 0; }
    });
  }

  private getRoleLabel(roles: string[]): string {
    if (roles?.includes('ROLE_SUPER_ADMIN')) return 'Super Admin';
    if (roles?.includes('ROLE_ADMIN'))       return 'Administrateur';
    if (roles?.includes('ROLE_MANAGER'))     return 'Manager';
    if (roles?.includes('ROLE_WAITER'))      return 'Serveur';
    return 'Utilisateur';
  }

  private loadUnreadCount(): void {
    this.notificationAdminSvc.getUnreadCount().subscribe({
      next: (res) => {
        this.unreadNotifCount = res.count;
        this.hasNotifications = res.count > 0;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  private connectNotifMercure(estId: number): void {
    if (this.mercureNotif) { this.mercureNotif.close(); }
    this.mercureNotif = this.notificationAdminSvc.subscribeToNotifications(estId);
    this.mercureNotif.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'NEW_NOTIFICATION') {
          this.unreadNotifCount++;
          this.hasNotifications = true;
          this.cdr.detectChanges();
        }
      } catch {}
    };
  }

  ngOnDestroy(): void {
    this.inactivitySub?.unsubscribe();
    this.inactivitySvc.stop();
    if (this.alertTimer) clearTimeout(this.alertTimer);
    if (this.mercureNotif) this.mercureNotif.close();
    // Publier OFFLINE à la destruction (navigation / déconnexion)
    if (this.isWaiter || this.authService.isManager()) {
      this.waiterStatusSvc.updateStatus('OFFLINE').subscribe({ error: () => {} });
    }
  }

  private openInactivityDialog(elapsedMin: number): void {
    // Arrêt temporaire de la détection pendant que la popup est ouverte
    this.inactivitySvc.stop();

    // US#3 — publier statut INACTIVE
    this.waiterStatusSvc.updateStatus('INACTIVE').subscribe({ error: () => {} });

    // US#4 — déclencher une alerte manager si la popup est ignorée > 2 min
    this.popupOpenMs = Date.now();
    if (this.alertTimer) clearTimeout(this.alertTimer);
    this.alertTimer = setTimeout(() => {
      // Toujours en INACTIVE après 2 min → publier un événement d'alerte séparé
      this.waiterStatusSvc.updateStatus('INACTIVE', 'ALERT_NO_RESPONSE').subscribe({ error: () => {} });
    }, 2 * 60 * 1000);

    const ref = this.dialog.open(InactivityDialogComponent, {
      data:         { minutes: elapsedMin },
      panelClass:   'inactivity-dialog-panel',
      maxWidth:     '460px',
      width:        '95vw',
    });

    ref.afterClosed().subscribe((result: ActivityResult | undefined) => {
      // Annuler l'alerte dès que la popup se ferme (avec ou sans réponse)
      if (this.alertTimer) { clearTimeout(this.alertTimer); this.alertTimer = null; }

      if (result) {
        // Waiter a choisi une activité
        this.inactivityStartMs = Date.now();
        this.inactivitySvc.start(0.5); // TEST : 30 secondes (remettre 10 en prod)

        // US#3 — mettre à jour le statut selon l'activité choisie
        const mappedStatus = result.type === 'BREAK' ? 'BREAK' : 'BUSY';
        this.waiterStatusSvc.updateStatus(mappedStatus, result.label).subscribe({ error: () => {} });

        // Log côté serveur (pour visibilité manager)
        this.waiterActivitySvc.declare({
          type:            result.type,
          label:           result.label,
          note:            result.note,
          inactiveMinutes: elapsedMin,
          durationMinutes: result.durationMinutes,
        }).subscribe({ error: () => {} });

        this.snackBar.open(
          `Activité enregistrée : ${result.label}${result.note ? ' — ' + result.note : ''}`,
          '✕',
          { duration: 3000, panelClass: ['snack-success'] }
        );
      } else {
        // Waiter a fermé sans répondre → rester INACTIVE, relancer la détection
        // La popup réapparaîtra au prochain cycle
        this.inactivityStartMs = Date.now();
        this.inactivitySvc.start(0.5); // TEST : 30 secondes (remettre 10 en prod)
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
