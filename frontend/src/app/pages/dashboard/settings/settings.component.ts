// src/app/pages/dashboard/settings/settings.component.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { EstablishmentService } from '../../../core/services/establishment.service';
import { PermissionService } from '../../../core/services/permission.service';
import { AuthService } from '../../../core/services/auth-service';
import { Establishment } from '../../../core/models/establishment.model';

export const ALL_PAYMENT_METHODS = [
  { value: 'cash',     label: 'Espèces',           icon: 'payments',        desc: 'Paiement en liquide sur place' },
  { value: 'card',     label: 'Carte bancaire',     icon: 'credit_card',     desc: 'CB, Visa, Mastercard, etc.' },
  { value: 'cheque',   label: 'Chèque',             icon: 'edit_document',   desc: 'Chèques bancaires' },
  { value: 'transfer', label: 'Virement',           icon: 'account_balance', desc: 'Virement bancaire' },
  { value: 'online',   label: 'Paiement en ligne',  icon: 'language',        desc: 'Lien de paiement digital' },
];

export const MANAGER_PERMISSIONS = [
  { key: 'canManageProducts',   label: 'Gérer les produits',     icon: 'inventory_2',       desc: 'Créer, modifier, supprimer des produits' },
  { key: 'canManageMenu',       label: 'Gérer les menus',        icon: 'menu_book',         desc: 'Organiser et publier les menus' },
  { key: 'canManageCategories', label: 'Gérer les catégories',   icon: 'category',          desc: 'Créer et modifier les catégories' },
  { key: 'canManagePacks',      label: 'Gérer les packs',        icon: 'layers',            desc: 'Créer des offres groupées' },
  { key: 'canManagePromotions', label: 'Gérer les promotions',   icon: 'local_offer',       desc: 'Créer et activer des promotions' },
  { key: 'canManageGallery',    label: 'Gérer la galerie',       icon: 'photo_library',     desc: 'Ajouter et supprimer des photos' },
  { key: 'canManageTables',     label: 'Gérer les tables',       icon: 'table_restaurant',  desc: 'Configurer les tables et QR codes' },
  { key: 'canViewReports',      label: 'Voir les rapports',      icon: 'bar_chart',         desc: 'Accéder aux statistiques et rapports' },
];

export const WAITER_PERMISSIONS = [
  { key: 'canManageOrders',  label: 'Gérer les commandes',  icon: 'receipt_long',      desc: 'Prendre et modifier des commandes' },
  { key: 'canManageTables',  label: 'Gérer les tables',     icon: 'table_restaurant',  desc: 'Changer le statut des tables' },
  { key: 'canViewReports',   label: 'Voir les rapports',    icon: 'bar_chart',         desc: 'Accéder aux statistiques' },
];

export const CUSTOM_PAYMENT_ICONS = [
  { icon: 'wallet',              label: 'Portefeuille' },
  { icon: 'qr_code',             label: 'QR / Mobile' },
  { icon: 'phone_iphone',        label: 'Mobile' },
  { icon: 'currency_exchange',   label: 'Devise / Crypto' },
  { icon: 'redeem',              label: 'Bon cadeau' },
  { icon: 'contactless',         label: 'Sans contact' },
  { icon: 'more_horiz',          label: 'Autre' },
];

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatTabsModule, MatSlideToggleModule, MatIconModule,
    MatButtonModule, MatSnackBarModule, MatProgressSpinnerModule,
    MatTooltipModule, MatFormFieldModule, MatInputModule
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  establishment: Establishment | null = null;
  loading = true;
  saving  = false;
  isAdmin = false;

  allPaymentMethods = ALL_PAYMENT_METHODS;
  managerPermissions = MANAGER_PERMISSIONS;
  waiterPermissions  = WAITER_PERMISSIONS;
  customPaymentIcons = CUSTOM_PAYMENT_ICONS;

  enabledPayments: Record<string, boolean> = {};
  customMethods: { value: string; label: string; icon: string }[] = [];

  // Formulaire ajout méthode custom
  showAddForm    = false;
  newMethodLabel = '';
  newMethodIcon  = 'wallet';

  managerPerms: Record<string, boolean> = {};
  waiterPerms:  Record<string, boolean> = {};

  facturationForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private establishmentService: EstablishmentService,
    private permissionService: PermissionService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.facturationForm = this.fb.group({
      tvaRate: [19, [Validators.required, Validators.min(0), Validators.max(100)]],
    });
    this.establishmentService.getAll().subscribe({
      next: (items) => {
        if (items.length > 0) {
          this.establishment = items[0];
          this.initState();
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  private initState(): void {
    if (!this.establishment) return;

    // Payment methods (standard)
    const enabled = this.establishment.paymentMethods ?? ['cash', 'card'];
    this.allPaymentMethods.forEach(m => {
      this.enabledPayments[m.value] = enabled.includes(m.value);
    });

    // Custom payment methods
    this.customMethods = [...(this.establishment.customPaymentMethods ?? [])];
    this.customMethods.forEach(m => {
      this.enabledPayments[m.value] = enabled.includes(m.value);
    });

    // Permissions
    const mp = this.establishment.staffPermissions?.manager ?? {};
    this.managerPermissions.forEach(p => {
      this.managerPerms[p.key] = mp[p.key] ?? true;
    });

    const wp = this.establishment.staffPermissions?.waiter ?? {};
    this.waiterPermissions.forEach(p => {
      this.waiterPerms[p.key] = wp[p.key] ?? true;
    });

    // Facturation
    this.facturationForm.patchValue({ tvaRate: this.establishment.tvaRate ?? 19 });
    if (!this.isAdmin) { this.facturationForm.disable(); }
  }

  addCustomMethod(): void {
    const label = this.newMethodLabel.trim();
    if (!label) return;
    const value = 'custom_' + label.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    const method = { value, label, icon: this.newMethodIcon };
    this.customMethods.push(method);
    this.enabledPayments[value] = true;
    this.newMethodLabel = '';
    this.newMethodIcon  = 'wallet';
    this.showAddForm    = false;
    this.cdr.detectChanges();
  }

  removeCustomMethod(method: { value: string; label: string; icon: string }): void {
    this.customMethods = this.customMethods.filter(m => m.value !== method.value);
    delete this.enabledPayments[method.value];
    this.cdr.detectChanges();
  }

  savePayments(): void {
    if (!this.establishment?.id) return;
    this.saving = true;

    // Tous les keys activés (standard + custom)
    const allKeys = [
      ...this.allPaymentMethods.map(m => m.value),
      ...this.customMethods.map(m => m.value),
    ];
    const methods = allKeys.filter(k => this.enabledPayments[k]);

    this.establishmentService.update(this.establishment.id, {
      paymentMethods: methods,
      customPaymentMethods: this.customMethods,
    } as any).subscribe({
      next: (est) => {
        this.establishment = est;
        this.saving = false;
        this.notify('Modes de paiement sauvegardés ✓');
        this.cdr.detectChanges();
      },
      error: (err) => { this.saving = false; this.notify(err.message, 'error'); }
    });
  }

  savePermissions(): void {
    if (!this.establishment?.id) return;
    this.saving = true;

    const staffPermissions = {
      manager: { ...this.managerPerms },
      waiter:  { ...this.waiterPerms },
    };

    this.establishmentService.update(this.establishment.id, { staffPermissions } as any).subscribe({
      next: (est) => {
        this.establishment = est;
        this.permissionService.loadFromEstablishment(est);
        this.saving = false;
        this.notify('Permissions sauvegardées ✓');
        this.cdr.detectChanges();
      },
      error: (err) => { this.saving = false; this.notify(err.message, 'error'); }
    });
  }

  saveFacturation(): void {
    if (!this.establishment?.id || this.facturationForm.invalid) return;
    this.saving = true;
    this.establishmentService.update(this.establishment.id, this.facturationForm.value as any).subscribe({
      next: (est) => {
        this.establishment = est;
        this.saving = false;
        this.notify('Paramètres de facturation sauvegardés ✓');
        this.cdr.detectChanges();
      },
      error: (err) => { this.saving = false; this.notify(err.message, 'error'); }
    });
  }

  getEnabledCount(): number {
    return Object.values(this.enabledPayments).filter(Boolean).length;
  }

  cancelAddForm(): void {
    this.showAddForm = false;
    this.newMethodLabel = '';
    this.newMethodIcon = 'wallet';
  }

  getManagerEnabledCount(): number {
    return Object.values(this.managerPerms).filter(Boolean).length;
  }

  getWaiterEnabledCount(): number {
    return Object.values(this.waiterPerms).filter(Boolean).length;
  }

  private notify(msg: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(msg, '✕', {
      duration: 3500,
      panelClass: type === 'error' ? ['snack-error'] : ['snack-success'],
      horizontalPosition: 'end', verticalPosition: 'top'
    });
  }
}
