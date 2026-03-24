// src/app/core/services/cart-storage.service.ts

import { Injectable } from '@angular/core';
import { PublicCartItem } from './public-order.service';

const CART_TTL_MS    = 2 * 60 * 60 * 1000; // 2 heures
const ORDERS_MAX     = 10;

export interface StoredCart {
  items:     PublicCartItem[];
  notes:     string;
  type:      'TABLE' | 'TAKEAWAY';
  savedAt:   number;
  expiresAt: number;
}

export interface StoredSession {
  customerName: string;
  savedAt:      number;
}

export interface StoredOrder {
  orderId:     number;
  orderNumber: string;
  total:       number;
  status:      string;
  items:       number; // nb articles
  createdAt:   number;
}

@Injectable({ providedIn: 'root' })
export class CartStorageService {

  // ── Panier ────────────────────────────────────────────────────────

  saveCart(token: string, items: PublicCartItem[], notes: string, type: string): void {
    const data: StoredCart = {
      items,
      notes,
      type:      type as 'TABLE' | 'TAKEAWAY',
      savedAt:   Date.now(),
      expiresAt: Date.now() + CART_TTL_MS
    };
    try {
      localStorage.setItem(`cart_${token}`, JSON.stringify(data));
    } catch (e) {}
  }

  loadCart(token: string): StoredCart | null {
    try {
      const raw = localStorage.getItem(`cart_${token}`);
      if (!raw) return null;
      const data: StoredCart = JSON.parse(raw);
      // Vérifier expiration
      if (Date.now() > data.expiresAt) {
        this.clearCart(token);
        return null;
      }
      return data;
    } catch (e) { return null; }
  }

  clearCart(token: string): void {
    try { localStorage.removeItem(`cart_${token}`); } catch (e) {}
  }

  hasCart(token: string): boolean {
    const cart = this.loadCart(token);
    return !!cart && cart.items.length > 0;
  }

  // ── Session client (prénom) ───────────────────────────────────────

  saveCustomerName(token: string, name: string): void {
    try {
      const data: StoredSession = { customerName: name, savedAt: Date.now() };
      localStorage.setItem(`client_${token}`, JSON.stringify(data));
    } catch (e) {}
  }

  loadCustomerName(token: string): string {
    try {
      const raw = localStorage.getItem(`client_${token}`);
      if (!raw) return '';
      const data: StoredSession = JSON.parse(raw);
      return data.customerName || '';
    } catch (e) { return ''; }
  }

  clearCustomerName(token: string): void {
    try { localStorage.removeItem(`client_${token}`); } catch (e) {}
  }

  // ── Historique commandes session ──────────────────────────────────

  addOrder(token: string, order: StoredOrder): void {
    try {
      const orders = this.loadOrders(token);
      orders.unshift(order);
      // Garder max N commandes
      const trimmed = orders.slice(0, ORDERS_MAX);
      localStorage.setItem(`orders_${token}`, JSON.stringify(trimmed));
    } catch (e) {}
  }

  loadOrders(token: string): StoredOrder[] {
    try {
      const raw = localStorage.getItem(`orders_${token}`);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  updateOrderStatus(token: string, orderId: number, status: string): void {
    try {
      const orders = this.loadOrders(token);
      const idx = orders.findIndex(o => o.orderId === orderId);
      if (idx !== -1) {
        orders[idx].status = status;
        localStorage.setItem(`orders_${token}`, JSON.stringify(orders));
      }
    } catch (e) {}
  }

  // ── Temps restant avant expiration du panier ──────────────────────

  getCartTimeRemaining(token: string): string {
    try {
      const raw = localStorage.getItem(`cart_${token}`);
      if (!raw) return '';
      const data: StoredCart = JSON.parse(raw);
      const remaining = data.expiresAt - Date.now();
      if (remaining <= 0) return '';
      const minutes = Math.floor(remaining / 60000);
      const hours   = Math.floor(minutes / 60);
      if (hours > 0) return `${hours}h${minutes % 60}min`;
      return `${minutes} min`;
    } catch (e) { return ''; }
  }
}
