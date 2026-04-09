// src/app/pages/menu-public/menu-public.component.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MenuService } from '../../core/services/menu.service';
import { MenuRead } from '../../core/models/menu.model';
import { Establishment } from '../../core/models/establishment.model';

@Component({
  selector: 'app-menu-public',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './menu-public.component.html',
  styleUrls: ['./menu-public.component.scss']
})
export class MenuPublicComponent implements OnInit {
  menu: MenuRead | null = null;
  establishment: Establishment | null = null;
  logoUrl: string | null = null;
  loading = true;
  notFound = false;

  constructor(
    private route: ActivatedRoute,
    private menuService: MenuService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.notFound = true;
      this.loading = false;
      return;
    }

    this.menuService.getByQrToken(token).subscribe({
      next: (menu) => {
        if (!menu) {
          this.notFound = true;
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        this.menu = menu;

        // Récupérer l'enseigne via l'IRI exposé dans la réponse du menu
        const establishmentIri: string | undefined = (menu as any).establishment;

        if (establishmentIri) {
          // Appel direct sur l'IRI (ex: /api/establishments/1)
          this.http.get<Establishment>(establishmentIri).subscribe({
            next: (est) => {
              this.establishment = est;
              if (est.logo) {
                this.logoUrl = `/uploads/logos/${est.logo}`;
              }
              this.loading = false;
              this.cdr.detectChanges();
            },
            error: () => {
              this.loading = false;
              this.cdr.detectChanges();
            }
          });
        } else {
          this.loading = false;
          this.cdr.detectChanges();
        }
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
