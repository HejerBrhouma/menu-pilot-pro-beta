// src/app/pages/dashboard/dashboard-component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { forkJoin } from 'rxjs';

import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { PackService } from '../../core/services/pack.service';

export interface StatCard {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  accent: string;
  route: string;
  trend?: number;
}

export interface QuickAction {
  label: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatRippleModule],
  templateUrl: './dashboard-component.html',
  styleUrls: ['./dashboard-component.scss']
})
export class DashboardComponent implements OnInit {

  loading = true;
  greeting = '';
  currentDate = new Date();

  stats: StatCard[] = [
    { label: 'Produits', value: '—', icon: 'inventory_2', color: '#6366f1', accent: '#eef2ff', route: '/products', trend: 0 },
    { label: 'Catégories', value: '—', icon: 'category', color: '#10b981', accent: '#ecfdf5', route: '/categories', trend: 0 },
    { label: 'Packs', value: '—', icon: 'layers', color: '#f59e0b', accent: '#fffbeb', route: '/pack', trend: 0 },
    { label: 'Menu QR actif', value: '1', icon: 'qr_code_2', color: '#3b82f6', accent: '#eff6ff', route: '/qr-code', trend: 0 },
  ];

  quickActions: QuickAction[] = [
    { label: 'Nouveau produit', icon: 'add_circle', route: '/products', color: '#6366f1' },
    { label: 'Nouvelle catégorie', icon: 'create_new_folder', route: '/categories', color: '#10b981' },
    { label: 'Nouveau pack', icon: 'add_box', route: '/pack', color: '#f59e0b' },
    { label: 'Voir le menu QR', icon: 'qr_code_scanner', route: '/qr-code', color: '#3b82f6' },
  ];

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private packService: PackService,
  ) {}

  ngOnInit(): void {
    this.setGreeting();
    this.loadStats();
  }

  setGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) this.greeting = 'Bonjour';
    else if (hour < 18) this.greeting = 'Bon après-midi';
    else this.greeting = 'Bonsoir';
  }

  loadStats(): void {
    forkJoin({
      products: this.productService.getAll(1, 1),
      categories: this.categoryService.getAll(),
      packs: this.packService.getAll(1, 1),
    }).subscribe({
      next: ({ products, categories, packs }) => {
        this.stats[0].value = products.total;
        this.stats[1].value = categories.length;
        this.stats[2].value = packs.total;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }
}
