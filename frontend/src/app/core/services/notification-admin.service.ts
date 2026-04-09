// src/app/core/services/notification-admin.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminNotif {
  id:        number;
  type:      string;
  message:   string;
  payload:   any;
  isRead:    boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationAdminService {
  private http = inject(HttpClient);

  getAll(): Observable<AdminNotif[]> {
    return this.http.get<AdminNotif[]>('/api/notifications');
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>('/api/notifications/unread-count');
  }

  markRead(id: number): Observable<any> {
    return this.http.post(`/api/notifications/${id}/read`, {});
  }

  markAllRead(): Observable<any> {
    return this.http.post('/api/notifications/read-all', {});
  }

  subscribeToNotifications(establishmentId: number): EventSource {
    const topic = encodeURIComponent(`notifications/${establishmentId}`);
    return new EventSource(`${environment.mercureUrl}?topic=${topic}`);
  }
}
