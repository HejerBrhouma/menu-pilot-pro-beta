// src/app/pages/dashboard/orders/order-new/order-new.component.ts

import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl} from '@angular/forms';
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
import { Order, OrderItem, RestaurantTable } from '../../../../core/models/order.model';

interface CartItem extends OrderItem {
  tempId: number;
}

@Component({
  selector: 'app-order-new',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterModule,
    MatIconModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatTooltipModule
  ],
  templateUrl: './order-new.component.html',
  styleUrls: ['./order-new.component.scss']
})
export class OrderNewComponent implements OnInit {
  form!: FormGroup;
  get tableControl(): FormControl { return this.form.get('table') as FormControl; }
  get notesControl(): FormControl { return this.form.get('notes') as FormControl; }
  saving     = false;
  isTakeaway = false;

  tables:   RestaurantTable[] = [];
  products: any[] = [];
  packs:    any[] = [];
  cart:     CartItem[] = [];

  activeTab: 'products' | 'packs' = 'products';
  searchQuery  = '';
  tempIdCounter = 0;

  currentTime = new Date();
  currentDate = new Date();

  // Palette de couleurs pour les avatars
  private avatarColors = [
    '#6366f1', '#10b981', '#f59e0b', '#3b82f6',
    '#ec4899', '#8b5cf6', '#14b8a6', '#ef4444'
  ];

  private orderService   = inject(OrderService);
  private productService = inject(ProductService);
  private http           = inject(HttpClient);
  private fb             = inject(FormBuilder);
  private router         = inject(Router);
  private snackBar       = inject(MatSnackBar);
  private cdr            = inject(ChangeDetectorRef);
  private route          = inject(ActivatedRoute);

  ngOnInit(): void {
    this.form = this.fb.group({
      table: [null],
      notes: [''],
    });

    // Mettre à jour l'heure toutes les minutes
    setInterval(() => { this.currentTime = new Date(); }, 60000);

    this.loadData();
  }

  loadData(): void {
    this.orderService.getTables().subscribe({
      next: (tables) => {
        this.tables = tables.filter(t => t.isActive);
        // Pré-sélectionner table depuis URL ?table=id
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
        this.cdr.detectChanges();
      }
    });

    this.http.get<any>('/api/packs?isActive=true').subscribe({
      next: (res: any) => {
        this.packs = res['hydra:member'] || [];
        this.cdr.detectChanges();
      }
    });
  }

  // ── Filtrage ─────────────────────────────────
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

  // ── Couleur avatar ─────────────────────────────
  getAvatarColor(name: string): string {
    const idx = name.charCodeAt(0) % this.avatarColors.length;
    return this.avatarColors[idx];
  }

  // ── Panier ───────────────────────────────────
  addToCart(item: any, type: 'PRODUCT' | 'PACK'): void {
    const existing = this.cart.find(c => c.itemId === item.id && c.itemType === type);
    if (existing) {
      this.updateQty(existing, existing.quantity + 1);
      return;
    }
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
    this.cdr.detectChanges();
  }

  updateQty(item: CartItem, qty: number): void {
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
    this.cdr.detectChanges();
  }

  removeFromCart(item: CartItem): void {
    this.cart = this.cart.filter(c => c.tempId !== item.tempId);
    this.cdr.detectChanges();
  }

  clearCart(): void {
    this.cart = [];
    this.cdr.detectChanges();
  }

  isInCart(itemId: number, type: 'PRODUCT' | 'PACK'): boolean {
    return this.cart.some(c => c.itemId === itemId && c.itemType === type);
  }

  getCartQty(itemId: number, type: 'PRODUCT' | 'PACK'): number {
    return this.cart.find(c => c.itemId === itemId && c.itemType === type)?.quantity || 0;
  }

  get cartSubtotal(): number {
    return Math.round(this.cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0) * 100) / 100;
  }

  get cartDiscount(): number {
    return Math.round(this.cart.reduce((sum, i) =>
      sum + (i.unitPrice - i.finalPrice) * i.quantity, 0) * 100) / 100;
  }

  get cartTotal(): number {
    return Math.round(this.cart.reduce((sum, i) => sum + i.finalPrice * i.quantity, 0) * 100) / 100;
  }

  get cartItemsCount(): number {
    return this.cart.reduce((sum, i) => sum + i.quantity, 0);
  }

  // ── Submit ────────────────────────────────────
  submit(): void {
    if (this.cart.length === 0) {
      this.notify('Le panier est vide', 'error');
      return;
    }
    if (!this.isTakeaway && !this.form.get('table')?.value) {
      this.notify('Sélectionnez une table ou choisissez "À emporter"', 'error');
      return;
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
