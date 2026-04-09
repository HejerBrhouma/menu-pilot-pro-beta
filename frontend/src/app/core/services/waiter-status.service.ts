// src/app/core/services/waiter-status.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StaffStatusEntry {
  userId:        number;
  firstName:     string;
  lastName:      string;
  roles:         string[];
  isActive:      boolean;
  status:        string | null;   // null = jamais connecté
  activityLabel: string | null;
  updatedAt:     string | null;
}

@Injectable({ providedIn: 'root' })
export class WaiterStatusService {
  private http = inject(HttpClient);

  /** Met à jour le statut de l'utilisateur courant */
  updateStatus(status: string, activityLabel?: string | null): Observable<any> {
    return this.http.post('/api/waiter/status', { status, activityLabel: activityLabel ?? null });
  }

  /** Récupère tous les statuts du personnel (pour le manager) */
  getAllStatus(): Observable<StaffStatusEntry[]> {
    return this.http.get<StaffStatusEntry[]>('/api/staff/status');
  }

  /** Ouvre un EventSource Mercure sur le topic staff/{estId} */
  subscribeToStaff(establishmentId: number): EventSource {
    const topic = encodeURIComponent(`staff/${establishmentId}`);
    return new EventSource(`${environment.mercureUrl}?topic=${topic}`);
  }
}
