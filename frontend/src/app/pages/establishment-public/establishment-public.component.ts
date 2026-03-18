// src/app/pages/restaurant-public/restaurant-public.component.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EstablishmentService } from '../../core/services/establishment.service';
import { MenuService } from '../../core/services/menu.service';
import { Establishment, DAYS_FR } from '../../core/models/establishment.model';
import { MenuRead } from '../../core/models/menu.model';

@Component({
  selector: 'app-establishment-public',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './establishment-public.component.html',
  styleUrls: ['./establishment-public.component.scss']
})
export class EstablishmentPublicComponent implements OnInit {
  establishment: Establishment | null = null;
  menus: MenuRead[] = [];
  loading = true;
  notFound = false;
  daysLabels = DAYS_FR;
  daysKeys = Object.keys(DAYS_FR);

  constructor(
    private route: ActivatedRoute,
    private establishmentService: EstablishmentService,
    private menuService: MenuService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) { this.notFound = true; this.loading = false; return; }

    this.establishmentService.getBySlug(slug).subscribe({
      next: (est) => {
        this.establishment = est;
        // Charger les menus actifs
        this.menuService.getAll(1, 100).subscribe({
          next: ({ items }) => {
            this.menus = items.filter(m => m.isActive);
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: () => { this.loading = false; this.cdr.detectChanges(); }
        });
      },
      error: () => { this.notFound = true; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  getLogoUrl(): string {
    return this.establishmentService.getLogoUrl(this.establishment?.logo);
  }

  isOpenNow(): boolean {
    if (!this.establishment?.openingHours) return false;
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const today = days[new Date().getDay()];
    const hours = (this.establishment.openingHours as any)[today];
    if (!hours || hours.closed) return false;
    const now = new Date();
    const [oh, om] = hours.open.split(':').map(Number);
    const [ch, cm] = hours.close.split(':').map(Number);
    const openMin  = oh * 60 + om;
    const closeMin = ch * 60 + cm;
    const nowMin   = now.getHours() * 60 + now.getMinutes();
    return nowMin >= openMin && nowMin <= closeMin;
  }

  getTodayHours(): string {
    if (!this.establishment?.openingHours) return '';
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const today = days[new Date().getDay()];
    const hours = (this.establishment.openingHours as any)[today];
    if (!hours || hours.closed) return 'Fermé aujourd\'hui';
    return `${hours.open} — ${hours.close}`;
  }
}
