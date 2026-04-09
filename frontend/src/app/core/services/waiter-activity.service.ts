// src/app/core/services/waiter-activity.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WaiterActivityPayload {
  type:             string;
  label:            string;
  note?:            string;
  inactiveMinutes:  number;
  durationMinutes?: number;
}

@Injectable({ providedIn: 'root' })
export class WaiterActivityService {
  private http = inject(HttpClient);

  declare(payload: WaiterActivityPayload): Observable<{ id: number }> {
    return this.http.post<{ id: number }>('/api/waiter/activity', payload);
  }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>('/api/waiter/activities');
  }
}
