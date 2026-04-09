// src/app/pages/public/table-menu/table-menu.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin, catchError, of } from 'rxjs';
import { ProductImageService } from '../../../core/services/product-image.service';
import { RatingCacheService } from '../../../core/services/rating-cache.service';
import { StarRatingComponent } from '../../../shared/star-rating/star-rating.component';
import { CustomerAuthService } from '../../../core/services/customer-auth.service';
import { ReviewService } from '../../../core/services/review.service';
import {
  PublicOrderService, PublicTableInfo, PublicCartItem
} from '../../../core/services/public-order.service';
import { CartStorageService, StoredOrder } from '../../../core/services/cart-storage.service';
import { NotificationService } from '../../../core/services/notification.service';

type AppScreen = 'welcome' | 'menu' | 'orders';
type WelcomeTab = 'guest' | 'login' | 'register';

declare const google: any;
declare const FB: any;

@Component({
  selector: 'app-table-menu',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    StarRatingComponent
  ],
  templateUrl: './table-menu.component.html',
  styleUrls: ['./table-menu.component.scss']
})
export class TableMenuComponent implements OnInit, OnDestroy {
  tableInfo:  PublicTableInfo | null = null;
  products:   any[] = [];
  packs:      any[] = [];
  categories: any[] = [];
  cart:       PublicCartItem[] = [];
  pastOrders: StoredOrder[] = [];

  loading     = true;
  submitting  = false;
  authLoading = false;
  error:      string | null = null;

  screen:      AppScreen  = 'welcome';
  welcomeTab:  WelcomeTab = 'guest';
  activeTab:   'products' | 'packs' = 'products';
  activeCat    = 'ALL';
  searchQuery  = '';
  showCart     = false;
  orderNotes   = '';
  showPass     = false;

  // Guest (sans compte)
  customerName      = '';
  customerNameInput = '';
  customerPhone     = '';

  // Login
  loginEmail    = '';
  loginPassword = '';

  // Register
  regFirstName = '';
  regLastName  = '';
  regEmail     = '';
  regPassword  = '';
  regPhone     = '';

  cartRestored      = false;
  cartTimeRemaining = '';
  imgErrors         = new Set<number>();

  // Ratings map
  ratingsMap = new Map<string, { avg: number; count: number }>();

  customerApiOrders: any[] = [];
  ordersLoading = false;

  private token         = '';
  private statusPollers = new Map<number, any>();
  private customerOrdersPoller: any = null;

  private route       = inject(ActivatedRoute);
  private router      = inject(Router);
  private reviewSvc   = inject(ReviewService);
  private publicSvc   = inject(PublicOrderService);
  private cartStorage = inject(CartStorageService);
  private notifSvc    = inject(NotificationService);
  private imageSvc    = inject(ProductImageService);
  private ratingCache = inject(RatingCacheService);
  private authSvc     = inject(CustomerAuthService);
  private snackBar    = inject(MatSnackBar);
  private cdr         = inject(ChangeDetectorRef);

  private readonly avatarColors = [
    '#6366f1','#10b981','#f59e0b','#3b82f6',
    '#ec4899','#8b5cf6','#14b8a6','#ef4444'
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (!this.token) { this.error = 'QR code invalide'; this.loading = false; return; }

    this.customerName = this.cartStorage.loadCustomerName(this.token);
    this.loadAll();
    this.initGoogleOAuth();
    this.initFacebookSDK();
  }

  ngOnDestroy(): void {
    this.statusPollers.forEach(i => clearInterval(i));
    if (this.customerOrdersPoller) clearInterval(this.customerOrdersPoller);
  }

  // ── Chargement ────────────────────────────────────────────────────

  loadAll(): void {
    this.publicSvc.getTableInfo(this.token).subscribe({
      next: (info) => {
        this.tableInfo = info;
        forkJoin({
          products:   this.publicSvc.getProducts(info.establishment.id).pipe(catchError(() => of({ 'hydra:member': [] }))),
          packs:      this.publicSvc.getPacks(info.establishment.id).pipe(catchError(() => of({ 'hydra:member': [] }))),
          categories: this.publicSvc.getCategories().pipe(catchError(() => of({ 'hydra:member': [] }))),
        }).subscribe({
          next: ({ products, packs, categories }) => {
            this.products   = products['hydra:member'] || [];
            this.packs      = packs['hydra:member'] || [];
            this.categories = categories['hydra:member'] || [];
            this.loading    = false;
            this.restoreCart();
            this.pastOrders = this.cartStorage.loadOrders(this.token);
            this.loadRatings();
            this.startOrderTracking();

            // Si déjà connecté ou nom connu → aller au menu
            if (this.authSvc.isLoggedIn || this.customerName) {
              if (this.authSvc.isLoggedIn) {
                this.customerName = this.authSvc.currentCustomer?.fullName || this.customerName;
                this.loadCustomerOrders();
              }
              this.screen = 'menu';
            }
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

  // ── Welcome screen ────────────────────────────────────────────────

  enterAsGuest(): void {
    const name  = this.customerNameInput.trim();
    if (!name) { this.snackBar.open('Veuillez saisir votre prénom', '✕', { duration: 2500 }); return; }
    this.customerName = name;
    this.cartStorage.saveCustomerName(this.token, name);
    this.screen = 'menu';
    this.cdr.detectChanges();
  }

  loginAndEnter(): void {
    if (!this.loginEmail || !this.loginPassword) return;
    this.authLoading = true;
    this.authSvc.login({ email: this.loginEmail, password: this.loginPassword }).subscribe({
      next: () => {
        this.authLoading  = false;
        this.customerName = this.authSvc.currentCustomer?.fullName || '';
        this.cartStorage.saveCustomerName(this.token, this.customerName);
        this.screen = 'menu';
        this.loadCustomerOrders();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.authLoading = false;
        this.snackBar.open(err.error?.error || 'Identifiants incorrects', '✕', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  registerAndEnter(): void {
    if (!this.regEmail || !this.regPassword || !this.regFirstName) return;
    this.authLoading = true;
    this.authSvc.register({
      email: this.regEmail, password: this.regPassword,
      firstName: this.regFirstName, lastName: this.regLastName
    }).subscribe({
      next: () => {
        this.authLoading  = false;
        this.customerName = this.authSvc.currentCustomer?.fullName || this.regFirstName;
        this.cartStorage.saveCustomerName(this.token, this.customerName);
        this.screen = 'menu';
        this.loadCustomerOrders();
        this.snackBar.open('Compte créé ✓', '✕', { duration: 2500, panelClass: ['snack-success'] });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.authLoading = false;
        this.snackBar.open(err.error?.error || 'Erreur inscription', '✕', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  // ── OAuth ─────────────────────────────────────────────────────────

  initGoogleOAuth(): void {
    const s = document.createElement('script');
    s.src   = 'https://accounts.google.com/gsi/client';
    s.onload = () => {
      this.renderGoogleButton();
    };
    document.head.appendChild(s);
  }

  renderGoogleButton(): void {
    if (typeof google === 'undefined') return;
    google.accounts.id.initialize({
      client_id: '880714273826-008hclp6kop4incg6lg4pv93bu7muid2.apps.googleusercontent.com',
      callback: (r: any) => this.handleGoogle(r)
    });
    // Attendre que le DOM soit prêt
    const tryRender = (attempts: number) => {
      const btn = document.getElementById('google-btn-table');
      if (btn) {
        google.accounts.id.renderButton(btn,
          { theme: 'outline', size: 'large', width: 340, text: 'continue_with' });
      } else if (attempts > 0) {
        setTimeout(() => tryRender(attempts - 1), 300);
      }
    };
    tryRender(10);
  }

  handleGoogle(response: any): void {
    this.authLoading = true;
    this.authSvc.loginWithGoogle(response.credential).subscribe({
      next: () => {
        this.authLoading  = false;
        this.customerName = this.authSvc.currentCustomer?.fullName || '';
        this.cartStorage.saveCustomerName(this.token, this.customerName);
        this.screen = 'menu';
        this.cdr.detectChanges();
      },
      error: () => { this.authLoading = false; this.cdr.detectChanges(); }
    });
  }

  initFacebookSDK(): void {
    (window as any).fbAsyncInit = () => {
      FB.init({ appId: 'TON_FACEBOOK_APP_ID', cookie: true, xfbml: true, version: 'v18.0' });
    };
    const s = document.createElement('script');
    s.src   = 'https://connect.facebook.net/fr_FR/sdk.js';
    document.head.appendChild(s);
  }

  loginWithFacebook(): void {
    FB.login((r: any) => {
      if (r.authResponse) {
        this.authLoading = true;
        this.authSvc.loginWithFacebook(r.authResponse.accessToken).subscribe({
          next: () => {
            this.authLoading  = false;
            this.customerName = this.authSvc.currentCustomer?.fullName || '';
            this.cartStorage.saveCustomerName(this.token, this.customerName);
            this.screen = 'menu';
            this.cdr.detectChanges();
          },
          error: () => { this.authLoading = false; this.cdr.detectChanges(); }
        });
      }
    }, { scope: 'email,public_profile' });
  }

  // ── Ratings ───────────────────────────────────────────────────────

  loadRatings(): void {
    [
      ...this.products.map((p: any) => ({ type: 'PRODUCT', id: p.id })),
      ...this.packs.map((p: any) => ({ type: 'PACK', id: p.id })),
    ].forEach(item => {
      this.ratingCache.getRating(item.type, item.id).subscribe(r => {
        this.ratingsMap.set(`${item.type}:${item.id}`, { avg: r.avgRating, count: r.count });
        this.cdr.detectChanges();
      });
    });
  }

  getRating(type: string, id: number): number {
    return this.ratingsMap.get(`${type}:${id}`)?.avg || 0;
  }

  getRatingCount(type: string, id: number): number {
    return this.ratingsMap.get(`${type}:${id}`)?.count || 0;
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
      this.snackBar.open(`🛒 Panier restauré — ${this.cartCount} article(s)`, '✕',
        { duration: 3000, horizontalPosition: 'center', verticalPosition: 'top' });
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
      this.publicSvc.getOrderStatus(orderId).subscribe({
        next: (data) => {
          const prev = this.pastOrders.find(o => o.orderId === orderId);
          if (prev && prev.status !== data.status) {
            this.notifSvc.notifyStatusChange(data.status);
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
        (p.categories || []).some((c: any) => (typeof c === 'string' ? c : c['@id']) === this.activeCat)
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
    else { this.cart.push({ itemType: type, itemId: item.id, itemName: item.name, unitPrice: item.price, quantity: 1, notes: '' }); }
    this.notifSvc.vibrate('soft');
    this.saveCartToStorage();
    this.cdr.detectChanges();
  }

  updateQty(item: PublicCartItem, qty: number): void {
    if (qty <= 0) { this.cart = this.cart.filter(c => !(c.itemId === item.itemId && c.itemType === item.itemType)); }
    else { item.quantity = qty; }
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

  get cartCount(): number { return this.cart.reduce((s, i) => s + i.quantity, 0); }
  get cartTotal(): number { return Math.round(this.cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0) * 100) / 100; }

  // ── Commande ──────────────────────────────────────────────────────

  submitOrder(): void {
    if (!this.tableInfo || this.cart.length === 0) return;
    this.submitting = true;
    this.publicSvc.createOrder(this.token, this.cart, this.orderNotes, this.customerName).subscribe({
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
        this.notifSvc.playSound('success');
        this.notifSvc.vibrate('medium');
        this.clearCart();
        this.showCart = false;
        this.screen   = 'orders';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.submitting = false;
        this.snackBar.open(err.message, '✕', { duration: 4000, horizontalPosition: 'center', verticalPosition: 'top' });
        this.cdr.detectChanges();
      }
    });
  }

  // ── Avis ──────────────────────────────────────────────────────────

  canReview(order: StoredOrder): boolean {
    return order.status === 'PAID';
  }

  goToReview(orderId: number): void {
    this.router.navigate(['/account/review', orderId]);
  }

  // ── Helpers ───────────────────────────────────────────────────────

  getLogoUrl(): string | null {
    return this.publicSvc.getLogoUrl(this.tableInfo?.establishment?.logo || null);
  }

  getProductImageUrl(product: any): string | null {
    return this.imageSvc.getImageUrl(product?.image);
  }

  getProductImageByName(name: string): string | null {
    const p = this.products.find(p => p.name === name);
    return p ? this.imageSvc.getImageUrl(p.image) : null;
  }

  onImgError(id: number): void {
    this.imgErrors.add(id);
    this.cdr.detectChanges();
  }

  getAvatarColor(name: string): string {
    if (!name) return this.avatarColors[0];
    return this.avatarColors[name.charCodeAt(0) % this.avatarColors.length];
  }

  getStatusLabel(s: string): string {
    const l: Record<string, string> = { PENDING: 'En attente', CONFIRMED: 'Confirmée', SERVED: 'Servie', PAID: 'Payée', CANCELLED: 'Annulée' };
    return l[s] || s;
  }

  getStatusColor(s: string): string {
    const c: Record<string, string> = { PENDING: '#f59e0b', CONFIRMED: '#6366f1', SERVED: '#10b981', PAID: '#059669', CANCELLED: '#ef4444' };
    return c[s] || '#9ca3af';
  }

  formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  loadCustomerOrders(): void {
    if (!this.isLoggedIn) return;
    this.ordersLoading = true;
    this.reviewSvc.getCustomerOrders().subscribe({
      next: (orders) => {
        this.customerApiOrders = orders;
        this.ordersLoading = false;
        this.cdr.detectChanges();
        this.startCustomerOrdersPolling();
      },
      error: () => { this.ordersLoading = false; this.cdr.detectChanges(); }
    });
  }

  private startCustomerOrdersPolling(): void {
    if (this.customerOrdersPoller) clearInterval(this.customerOrdersPoller);
    const hasActive = this.customerApiOrders.some(o => !['PAID', 'CANCELLED'].includes(o.status));
    if (!hasActive) return;
    this.customerOrdersPoller = setInterval(() => {
      this.reviewSvc.getCustomerOrders().subscribe({
        next: (orders) => {
          this.customerApiOrders = orders;
          this.cdr.detectChanges();
          const stillActive = orders.some(o => !['PAID', 'CANCELLED'].includes(o.status));
          if (!stillActive) { clearInterval(this.customerOrdersPoller); this.customerOrdersPoller = null; }
        },
        error: () => {}
      });
    }, 10000);
  }

  hasActiveOrders(): boolean {
    if (this.isLoggedIn) {
      return this.customerApiOrders.some(o => !['PAID', 'CANCELLED'].includes(o.status));
    }
    return this.pastOrders.some(o => !['PAID', 'CANCELLED'].includes(o.status));
  }

  get isLoggedIn(): boolean { return this.authSvc.isLoggedIn; }
  get currentCustomer(): any { return this.authSvc.currentCustomer; }

  logout(): void {
    this.authSvc.logout();
    this.customerName = '';
    this.cartStorage.clearCustomerName(this.token);
    this.screen = 'welcome';
    this.cdr.detectChanges();
    setTimeout(() => this.renderGoogleButton(), 300);
  }
}
