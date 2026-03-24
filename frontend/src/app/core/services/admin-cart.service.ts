// src/app/core/services/admin-cart.service.ts
// Persistance du panier admin/serveur dans localStorage
// Clé unique par user + type (TABLE ou TAKEAWAY)

import { Injectable } from '@angular/core';

const CART_KEY    = 'admin_cart_draft';
const CART_TTL_MS = 4 * 60 * 60 * 1000; // 4 heures

export interface AdminCartItem {
  tempId:     number;
  itemType:   'PRODUCT' | 'PACK';
  itemId:     number;
  itemName:   string;
  unitPrice:  number;
  finalPrice: number;
  quantity:   number;
  notes:      string;
}

export interface AdminCartDraft {
  cart:        AdminCartItem[];
  tableIri:    string | null;
  isTakeaway:  boolean;
  notes:       string;
  savedAt:     number;
  expiresAt:   number;
}

@Injectable({ providedIn: 'root' })
export class AdminCartService {

  save(draft: Omit<AdminCartDraft, 'savedAt' | 'expiresAt'>): void {
    if (!draft.cart.length) {
      this.clear();
      return;
    }
    const data: AdminCartDraft = {
      ...draft,
      savedAt:   Date.now(),
      expiresAt: Date.now() + CART_TTL_MS,
    };
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  load(): AdminCartDraft | null {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return null;
      const data: AdminCartDraft = JSON.parse(raw);
      if (Date.now() > data.expiresAt) {
        this.clear();
        return null;
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(CART_KEY);
    } catch (e) {}
  }

  hasCart(): boolean {
    const draft = this.load();
    return !!draft && draft.cart.length > 0;
  }

  getTimeRemaining(): string {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return '';
      const data: AdminCartDraft = JSON.parse(raw);
      const remaining = data.expiresAt - Date.now();
      if (remaining <= 0) return '';
      const minutes = Math.floor(remaining / 60000);
      const hours   = Math.floor(minutes / 60);
      return hours > 0 ? `${hours}h${minutes % 60}min` : `${minutes}min`;
    } catch (e) {
      return '';
    }
  }
}
