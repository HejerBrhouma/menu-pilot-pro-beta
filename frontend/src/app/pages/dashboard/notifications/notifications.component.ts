// src/app/pages/dashboard/notifications/notifications.component.ts
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationAdminService, AdminNotif } from '../../../core/services/notification-admin.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatTooltipModule, MatSnackBarModule
  ],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  notifications: AdminNotif[] = [];
  loading = true;
  filter: 'ALL' | 'UNREAD' = 'ALL';

  private svc      = inject(NotificationAdminService);
  private snackBar = inject(MatSnackBar);
  private cdr      = inject(ChangeDetectorRef);

  get displayed(): AdminNotif[] {
    if (this.filter === 'UNREAD') return this.notifications.filter(n => !n.isRead);
    return this.notifications;
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: (notifs) => {
        this.notifications = notifs;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  markRead(notif: AdminNotif): void {
    if (notif.isRead) return;
    this.svc.markRead(notif.id).subscribe({
      next: () => {
        notif.isRead = true;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  markAllRead(): void {
    this.svc.markAllRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.isRead = true);
        this.cdr.detectChanges();
        this.snackBar.open('Toutes les notifications ont été lues', '✕', {
          duration: 2500, panelClass: ['snack-success']
        });
      },
      error: () => {}
    });
  }

  iconFor(type: string): string {
    switch (type) {
      case 'ACTIVITY_DECLARED': return 'check_circle';
      case 'ALERT_NO_RESPONSE': return 'warning';
      case 'STATUS_CHANGE':     return 'swap_horiz';
      default:                  return 'notifications';
    }
  }

  colorFor(type: string): string {
    switch (type) {
      case 'ACTIVITY_DECLARED': return '#10b981';
      case 'ALERT_NO_RESPONSE': return '#ef4444';
      case 'STATUS_CHANGE':     return '#6366f1';
      default:                  return '#9ca3af';
    }
  }
}
