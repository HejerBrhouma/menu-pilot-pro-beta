// src/app/pages/menu-public/menu-public.component.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MenuService } from '../../core/services/menu.service';
import { MenuRead } from '../../core/models/menu.model';

@Component({
  selector: 'app-menu-public',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './menu-public.component.html',
  styleUrls: ['./menu-public.component.scss']
})
export class MenuPublicComponent implements OnInit {
  menu: MenuRead | null = null;
  loading = true;
  notFound = false;

  constructor(
    private route: ActivatedRoute,
    private menuService: MenuService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.notFound = true;
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.menuService.getByQrToken(token).subscribe({
      next: (menu) => {
        if (!menu) {
          this.notFound = true;
        } else {
          this.menu = menu;
        }
        this.loading = false;
        this.cdr.detectChanges(); // ← forcer mise à jour template
      },
      error: () => {
        this.notFound = true;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getTotalItems(section: any): number {
    return (section.products?.length ?? 0) +
      (section.packs?.length ?? 0) +
      (section.categories?.length ?? 0);
  }
}
