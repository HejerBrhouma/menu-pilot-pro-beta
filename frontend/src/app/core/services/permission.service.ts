// src/app/core/services/permission.service.ts

import { Injectable } from '@angular/core';
import { Establishment } from '../models/establishment.model';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private permissions: { manager?: Record<string, boolean>; waiter?: Record<string, boolean> } = {};

  loadFromEstablishment(est: Establishment): void {
    this.permissions = est.staffPermissions ?? {};
  }

  managerCan(action: string): boolean {
    return this.permissions.manager?.[action] ?? true;
  }

  waiterCan(action: string): boolean {
    return this.permissions.waiter?.[action] ?? true;
  }

  getPaymentMethods(allMethods: { value: string; label: string; icon: string }[], enabledKeys: string[]): { value: string; label: string; icon: string }[] {
    if (!enabledKeys || enabledKeys.length === 0) return allMethods;
    return allMethods.filter(m => enabledKeys.includes(m.value.toLowerCase()));
  }
}
