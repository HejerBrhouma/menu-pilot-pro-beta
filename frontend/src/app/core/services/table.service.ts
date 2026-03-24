// src/app/core/services/table.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Table } from '../models/table.model';
import { map } from 'rxjs/operators';
@Injectable({ providedIn: 'root' })
export class TableService {

  constructor(private http: HttpClient) {}

  getAll(): Observable<Table[]> {
    return this.http.get<any>('/api/tables').pipe(
      map(res => res['hydra:member'])
    );
  }

  updateStatus(id: number, status: string): Observable<any> {
    return this.http.patch(`/api/tables/${id}`, { status }, {
      headers: { 'Content-Type': 'application/merge-patch+json' }
    });
  }
}
