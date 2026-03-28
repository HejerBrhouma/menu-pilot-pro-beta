// src/app/pages/dashboard/orders/order-new/order-new.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { OrderService } from '../../../../core/services/order.service';
import { ProductService } from '../../../../core/services/product.service';
import { AdminCartService, AdminCartItem } from '../../../../core/services/admin-cart.service';
import { ProductImageService } from '../../../../core/services/product-image.service';
import { RatingCacheService } from '../../../../core/services/rating-cache.service';
import { StarRatingComponent } from '../../../../shared/star-rating/star-rating.component';
import { Order, RestaurantTable } from '../../../../core/models/order.model';

@Component({
  selector: 'app-order-new',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterModule,
    MatIconModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatTooltipModule,
    StarRatingComponent
  ],
  templateUrl: './order-new.component.html',
  styleUrls: ['./order-new.component.scss']
})
export class OrderNewComponent implements OnInit, OnDestroy {
  form!:             FormGroup;
  saving             = false;
  isTakeaway         = false;
  cartRestored       = false;
  cartTimeRemaining  = '';

  tables:   RestaurantTable[] = [];
  products: any[]             = [];
  packs:    any[]             = [];
  cart:     AdminCartItem[]   = [];

  activeTab:    'products' | 'packs' = 'products';
  searchQuery   = '';
  tempIdCounter = 0;
  currentTime   = new Date();
  currentDate   = new Date();

  private ratingsMap = new Map<string, { avg: number; count: number }>();
  private clockInterval: any;

  private readonly avatarColors = [
    '#6366f1', '#10b981', '#f59e0b', '#3b82f6',
    '#ec4899', '#8b5cf6', '#14b8a6', '#ef4444'
  ];

  private orderService     = inject(OrderService);
  private productService   = inject(ProductService);
  private adminCartService = inject(AdminCartService);
  private imageService     = inject(ProductImageService);
  private ratingCache      = inject(RatingCacheService);
  private http             = inject(HttpClient);
  private fb               = inject(FormBuilder);
  private router           = inject(Router);
  private snackBar         = inject(MatSnackBar);
  private cdr              = inject(ChangeDetectorRef);
  private route            = inject(ActivatedRoute);

  get tableControl(): FormControl { return this.form.get('table') as FormControl; }
  get notesControl(): FormControl { return this.form.get('notes') as FormControl; }

  ngOnInit(): void {
    this.form = this.fb.group({ table: [null], notes: [''] });
    this.clockInterval = setInterval(() => { this.currentTime = new Date(); }, 60000);
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  loadData(): void {
    this.orderService.getTables().subscribe({
      next: (tables) => {
        this.tables = tables.filter(t => t.isActive);
        this.restoreCart();
        const tableId = this.route.snapshot.queryParamMap.get('table');
        if (tableId) {
          this.form.get('table')?.setValue('/api/tables/' + tableId);
          this.isTakeaway = false;
        }
        this.cdr.detectChanges();
      }
    });

    this.productService.getAll(1, 100).subscribe({
      next: ({ items }) => {
        this.products = items.filter((p: any) => p.isAvailable);
        this.loadRatings();
        this.cdr.detectChanges();
      }
    });

    this.http.get<any>('/api/packs?isActive=true').subscribe({
      next: (res: any) => {
        this.packs = res['hydra:member'] || [];
        this.loadRatings();
        this.cdr.detectChanges();
      }
    });
  }

  // ── Ratings ───────────────────────────────────────────────────────

  loadRatings(): void {
    [
      ...this.products.map((p: any) => ({ type: 'PRODUCT', id: p.id })),
      ...this.packs.map((p: any)    => ({ type: 'PACK',    id: p.id })),
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

  // ── Persistance panier ────────────────────────────────────────────

  restoreCart(): void {
    const draft = this.adminCartService.load();
    if (!draft || draft.cart.length === 0) return;

    this.cart              = draft.cart.map(item => ({ ...item, tempId: ++this.tempIdCounter }));
    this.isTakeaway        = draft.isTakeaway;
    this.cartRestored      = true;
    this.cartTimeRemaining = this.adminCartService.getTimeRemaining();

    if (draft.tableIri) this.form.get('table')?.setValue(draft.tableIri);
    if (draft.notes)    this.form.get('notes')?.setValue(draft.notes);

    setTimeout(() => {
      this.snackBar.open(
        `🛒 Panier restauré — ${this.cartItemsCount} article(s) · expire dans ${this.cartTimeRemaining}`,
        '✕',
        { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['snack-success'] }
      );
    }, 500);
  }

  private persistCart(): void {
    this.adminCartService.save({
      cart:       this.cart,
      tableIri:   this.form.get('table')?.value || null,
      isTakeaway: this.isTakeaway,
      notes:      this.form.get('notes')?.value || '',
    });
    this.cartTimeRemaining = this.adminCartService.getTimeRemaining();
  }

  onItemNoteChange(): void { this.persistCart(); }
  onFormChange():     void { this.persistCart(); }

  // ── Filtres ───────────────────────────────────────────────────────

  get filteredProducts(): any[] {
    if (!this.searchQuery) return this.products;
    const q = this.searchQuery.toLowerCase();
    return this.products.filter(p => p.name.toLowerCase().includes(q));
  }

  get filteredPacks(): any[] {
    if (!this.searchQuery) return this.packs;
    const q = this.searchQuery.toLowerCase();
    return this.packs.filter(p => p.name.toLowerCase().includes(q));
  }

  // ── Helpers visuels ───────────────────────────────────────────────

  getAvatarColor(name: string): string {
    return this.avatarColors[name.charCodeAt(0) % this.avatarColors.length];
  }

  getProductImageUrl(product: any): string | null {
    return this.imageService.getImageUrl(product?.image);
  }

  getProductImageByName(name: string): string | null {
    const product = this.products.find((p: any) => p.name === name);
    return product ? this.imageService.getImageUrl(product.image) : null;
  }

  // ── Panier ────────────────────────────────────────────────────────

  addToCart(item: any, type: 'PRODUCT' | 'PACK'): void {
    const existing = this.cart.find(c => c.itemId === item.id && c.itemType === type);
    if (existing) { this.updateQty(existing, existing.quantity + 1); return; }
    this.cart = [...this.cart, {
      tempId:     ++this.tempIdCounter,
      itemType:   type,
      itemId:     item.id,
      itemName:   item.name,
      unitPrice:  item.price,
      finalPrice: item.price,
      quantity:   1,
      notes:      '',
    }];
    this.persistCart();
    this.cdr.detectChanges();
  }

  updateQty(item: AdminCartItem, qty: number): void {
    if (qty <= 0) {
      this.cart = this.cart.filter(c => c.tempId !== item.tempId);
    } else {
      const i = this.cart.findIndex(c => c.tempId === item.tempId);
      if (i !== -1) {
        this.cart = [
          ...this.cart.slice(0, i),
          { ...this.cart[i], quantity: qty },
          ...this.cart.slice(i + 1)
        ];
      }
    }
    this.persistCart();
    this.cdr.detectChanges();
  }

  removeFromCart(item: AdminCartItem): void {
    this.cart = this.cart.filter(c => c.tempId !== item.tempId);
    this.persistCart();
    this.cdr.detectChanges();
  }

  clearCart(): void {
    this.cart = [];
    this.adminCartService.clear();
    this.cdr.detectChanges();
  }

  isInCart(itemId: number, type: 'PRODUCT' | 'PACK'): boolean {
    return this.cart.some(c => c.itemId === itemId && c.itemType === type);
  }

  getCartQty(itemId: number, type: 'PRODUCT' | 'PACK'): number {
    return this.cart.find(c => c.itemId === itemId && c.itemType === type)?.quantity || 0;
  }

  get cartSubtotal(): number {
    return Math.round(this.cart.reduce((s, i) => s + i.unitPrice  * i.quantity, 0) * 100) / 100;
  }

  get cartDiscount(): number {
    return Math.round(this.cart.reduce((s, i) =>
      s + (i.unitPrice - i.finalPrice) * i.quantity, 0) * 100) / 100;
  }

  get cartTotal(): number {
    return Math.round(this.cart.reduce((s, i) => s + i.finalPrice * i.quantity, 0) * 100) / 100;
  }

  get cartItemsCount(): number {
    return this.cart.reduce((s, i) => s + i.quantity, 0);
  }

  // ── Soumission ────────────────────────────────────────────────────

  submit(): void {
    if (this.cart.length === 0) {
      this.notify('Le panier est vide', 'error'); return;
    }
    if (!this.isTakeaway && !this.form.get('table')?.value) {
      this.notify('Sélectionnez une table ou choisissez "À emporter"', 'error'); return;
    }

    this.saving = true;

    const payload: Partial<Order> = {
      type:  this.isTakeaway ? 'TAKEAWAY' : 'TABLE',
      table: (!this.isTakeaway ? this.form.get('table')?.value : null) as string | null,
      notes: this.form.get('notes')?.value || null,
      items: this.cart.map(item => ({
        itemType:   item.itemType,
        itemId:     item.itemId,
        itemName:   item.itemName,
        unitPrice:  item.unitPrice,
        finalPrice: item.finalPrice,
        quantity:   item.quantity,
        notes:      item.notes || undefined,
      }))
    };

    this.orderService.create(payload).subscribe({
      next: (order) => {
        this.saving = false;
        this.adminCartService.clear();
        this.notify('Commande ' + order.orderNumber + ' créée ✓');
        this.router.navigate(['/orders']);
      },
      error: (err: any) => {
        this.saving = false;
        this.notify(err.message, 'error');
      }
    });
  }

  private notify(msg: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(msg, '✕', {
      duration: 3500,
      panelClass: type === 'error' ? ['snack-error'] : ['snack-success'],
      horizontalPosition: 'end', verticalPosition: 'top'
    });
  }
}
