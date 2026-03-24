// src/app/pages/public/table-menu/table-menu.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { catchError, of } from 'rxjs';
import { ProductImageService } from '../../../core/services/product-image.service';
import {
  PublicOrderService,
  PublicTableInfo,
  PublicCartItem
} from '../../../core/services/public-order.service';
import { CartStorageService, StoredOrder } from '../../../core/services/cart-storage.service';
import { NotificationService } from '../../../core/services/notification.service';

type AppScreen = 'welcome' | 'menu' | 'orders';

@Component({
  selector: 'app-table-menu',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatSnackBarModule
  ],
  templateUrl: './table-menu.component.html',
  styleUrls: ['./table-menu.component.scss']
})
export class TableMenuComponent implements OnInit, OnDestroy {
  tableInfo:    PublicTableInfo | null = null;
  products:     any[] = [];
  packs:        any[] = [];
  categories:   any[] = [];
  cart:         PublicCartItem[] = [];
  pastOrders:   StoredOrder[] = [];

  loading       = true;
  submitting    = false;
  error:        string | null = null;

  screen:       AppScreen = 'welcome';
  activeTab:    'products' | 'packs' = 'products';
  activeCat:    string = 'ALL';
  searchQuery   = '';
  showCart      = false;
  orderNotes    = '';

  customerName      = '';
  customerNameInput = '';
  cartRestored      = false;
  cartTimeRemaining = '';

  private token         = '';
  private statusPollers: Map<number, any> = new Map();

  // ── Services ─────────────────────────────────────────────────────
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private publicService  = inject(PublicOrderService);
  private cartStorage    = inject(CartStorageService);
  private notifService   = inject(NotificationService);
  private imageService   = inject(ProductImageService);
  private snackBar       = inject(MatSnackBar);
  private cdr            = inject(ChangeDetectorRef);

  // ── Couleurs avatars ──────────────────────────────────────────────
  private readonly avatarColors = [
    '#6366f1','#10b981','#f59e0b','#3b82f6',
    '#ec4899','#8b5cf6','#14b8a6','#ef4444'
  ];

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (!this.token) { this.error = 'QR code invalide'; this.loading = false; return; }
    this.customerName = this.cartStorage.loadCustomerName(this.token);
    this.loadAll();
  }

  ngOnDestroy(): void {
    this.statusPollers.forEach(interval => clearInterval(interval));
  }

  loadAll(): void {
    this.publicService.getTableInfo(this.token).subscribe({
      next: (info) => {
        this.tableInfo = info;
        forkJoin({
          products:   this.publicService.getProducts(info.establishment.slug).pipe(catchError(() => of({ 'hydra:member': [] }))),
          packs:      this.publicService.getPacks().pipe(catchError(() => of({ 'hydra:member': [] }))),
          categories: this.publicService.getCategories().pipe(catchError(() => of({ 'hydra:member': [] }))),
        }).subscribe({
          next: ({ products, packs, categories }) => {
            this.products   = products['hydra:member'] || [];
            this.packs      = packs['hydra:member'] || [];
            this.categories = categories['hydra:member'] || [];
            this.loading    = false;
            this.restoreCart();
            this.pastOrders = this.cartStorage.loadOrders(this.token);
            if (this.customerName) this.screen = 'menu';
            this.startOrderTracking();
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        this.error   = err.message || 'Table introuvable';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Accueil ───────────────────────────────────────────────────────

  enterMenu(): void {
    const name = this.customerNameInput.trim();
    this.customerName = name;
    if (name) this.cartStorage.saveCustomerName(this.token, name);
    this.screen = 'menu';
    this.cdr.detectChanges();
  }

  // ── Panier persistant ─────────────────────────────────────────────

  restoreCart(): void {
    const saved = this.cartStorage.loadCart(this.token);
    if (!saved || saved.items.length === 0) return;
    this.cart              = saved.items;
    this.orderNotes        = saved.notes;
    this.cartRestored      = true;
    this.cartTimeRemaining = this.cartStorage.getCartTimeRemaining(this.token);
    setTimeout(() => {
      this.snackBar.open(
        `🛒 Panier restauré — ${this.cartCount} article(s)`,
        '✕',
        { duration: 3000, horizontalPosition: 'center', verticalPosition: 'top' }
      );
    }, 800);
  }

  saveCartToStorage(): void {
    this.cartStorage.saveCart(this.token, this.cart, this.orderNotes, 'TABLE');
    this.cartTimeRemaining = this.cartStorage.getCartTimeRemaining(this.token);
  }

  // ── Suivi commandes ───────────────────────────────────────────────

  startOrderTracking(): void {
    this.pastOrders
      .filter(o => !['PAID', 'CANCELLED'].includes(o.status))
      .forEach(o => this.pollOrderStatus(o.orderId));
  }

  pollOrderStatus(orderId: number): void {
    if (this.statusPollers.has(orderId)) return;
    const interval = setInterval(() => {
      this.publicService.getOrderStatus(orderId).subscribe({
        next: (data) => {
          const prev = this.pastOrders.find(o => o.orderId === orderId);
          if (prev && prev.status !== data.status) {
            this.notifService.notifyStatusChange(data.status);
            this.cartStorage.updateOrderStatus(this.token, orderId, data.status);
            this.pastOrders = this.cartStorage.loadOrders(this.token);
            this.cdr.detectChanges();
            if (['PAID', 'CANCELLED'].includes(data.status)) {
              clearInterval(interval);
              this.statusPollers.delete(orderId);
            }
          }
        }
      });
    }, 10000);
    this.statusPollers.set(orderId, interval);
  }

  // ── Filtres ───────────────────────────────────────────────────────

  get filteredProducts(): any[] {
    let list = this.products;
    if (this.activeCat !== 'ALL') {
      list = list.filter(p =>
        (p.categories || []).some((c: any) => {
          const iri = typeof c === 'string' ? c : c['@id'];
          return iri === this.activeCat;
        })
      );
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    return list;
  }

  get filteredPacks(): any[] {
    if (!this.searchQuery.trim()) return this.packs;
    const q = this.searchQuery.toLowerCase();
    return this.packs.filter(p => p.name.toLowerCase().includes(q));
  }

  // ── Panier ────────────────────────────────────────────────────────

  addToCart(item: any, type: 'PRODUCT' | 'PACK'): void {
    const existing = this.cart.find(c => c.itemId === item.id && c.itemType === type);
    if (existing) { existing.quantity++; }
    else {
      this.cart.push({ itemType: type, itemId: item.id, itemName: item.name,
        unitPrice: item.price, quantity: 1, notes: '' });
    }
    this.notifService.vibrate('soft');
    this.saveCartToStorage();
    this.cdr.detectChanges();
  }

  updateQty(item: PublicCartItem, qty: number): void {
    if (qty <= 0) {
      this.cart = this.cart.filter(c => !(c.itemId === item.itemId && c.itemType === item.itemType));
    } else {
      item.quantity = qty;
    }
    this.saveCartToStorage();
    this.cdr.detectChanges();
  }

  removeFromCart(item: PublicCartItem): void {
    this.cart = this.cart.filter(c => !(c.itemId === item.itemId && c.itemType === item.itemType));
    this.saveCartToStorage();
    this.cdr.detectChanges();
  }

  clearCart(): void {
    this.cart = [];
    this.orderNotes = '';
    this.cartStorage.clearCart(this.token);
    this.cdr.detectChanges();
  }

  isInCart(id: number, type: string): boolean {
    return this.cart.some(c => c.itemId === id && c.itemType === type);
  }

  getQty(id: number, type: string): number {
    return this.cart.find(c => c.itemId === id && c.itemType === type)?.quantity || 0;
  }

  getCartItem(id: number, type: string): PublicCartItem | undefined {
    return this.cart.find(c => c.itemId === id && c.itemType === type);
  }

  get cartCount(): number {
    return this.cart.reduce((s, i) => s + i.quantity, 0);
  }

  get cartTotal(): number {
    return Math.round(this.cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0) * 100) / 100;
  }

  // ── Commande ──────────────────────────────────────────────────────

  submitOrder(): void {
    if (!this.tableInfo || this.cart.length === 0) return;
    this.submitting = true;

    this.publicService.createOrder(
      this.token, this.cart, this.orderNotes, this.customerName
    ).subscribe({
      next: (result) => {
        this.submitting = false;
        const stored: StoredOrder = {
          orderId: result.orderId, orderNumber: result.orderNumber,
          total: result.total, status: result.status,
          items: this.cartCount, createdAt: Date.now()
        };
        this.cartStorage.addOrder(this.token, stored);
        this.pastOrders = this.cartStorage.loadOrders(this.token);
        this.pollOrderStatus(result.orderId);
        this.notifService.playSound('success');
        this.notifService.vibrate('medium');
        this.clearCart();
        this.showCart = false;
        this.screen   = 'orders';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.submitting = false;
        this.snackBar.open(err.message, '✕', {
          duration: 4000, horizontalPosition: 'center', verticalPosition: 'top'
        });
        this.cdr.detectChanges();
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────

  getLogoUrl(): string | null {
    return this.publicService.getLogoUrl(this.tableInfo?.establishment?.logo || null);
  }

  getProductImageUrl(product: any): string | null {
    return this.imageService.getImageUrl(product?.image);
  }

  getProductImageByName(name: string): string | null {
    const product = this.products.find(p => p.name === name);
    return product ? this.imageService.getImageUrl(product.image) : null;
  }

  getAvatarColor(name: string): string {
    return this.avatarColors[name.charCodeAt(0) % this.avatarColors.length];
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'En attente', CONFIRMED: 'Confirmée',
      SERVED: 'Servie', PAID: 'Payée', CANCELLED: 'Annulée'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      PENDING: '#f59e0b', CONFIRMED: '#6366f1',
      SERVED: '#10b981', PAID: '#059669', CANCELLED: '#ef4444'
    };
    return colors[status] || '#9ca3af';
  }

  formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  hasActiveOrders(): boolean {
    return this.pastOrders.some(o => !['PAID', 'CANCELLED'].includes(o.status));
  }
}
