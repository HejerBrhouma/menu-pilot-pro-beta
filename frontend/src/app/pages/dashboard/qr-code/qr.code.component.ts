// src/app/pages/dashboard/qr-code/qr-code.component.ts

import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MenuService } from '../../../core/services/menu.service';
import { MenuRead } from '../../../core/models/menu.model';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

@Component({
  selector: 'app-qr-code',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatSelectModule,
    MatFormFieldModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatCardModule, MatTooltipModule
  ],
  templateUrl: './qr-code.component.html',
  styleUrls: ['./qr-code.component.scss']
})
export class QrCodeComponent implements OnInit {

  menus: MenuRead[] = [];
  selectedMenu: MenuRead | null = null;
  qrDataUrl = '';
  loading = false;
  generating = false;

  constructor(
    private menuService: MenuService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadMenus();
  }

  loadMenus(): void {
    this.loading = true;
    this.menuService.getAll(1, 100).subscribe({
      next: ({ items }) => {
        this.menus = items;
        this.loading = false;
        // Sélectionner le premier menu actif par défaut
        const active = items.find(m => m.isActive) ?? items[0];
        if (active) {
          this.selectMenu(active);
        }
      },
      error: (err) => {
        console.error('Erreur chargement menus:', err);
        this.loading = false;
      }
    });
  }

  async selectMenu(menu: MenuRead): Promise<void> {
    this.selectedMenu = menu;
    this.qrDataUrl = '';
    try {
      const url = this.getMenuUrl(menu);
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: { dark: '#0f1629', light: '#ffffff' }
      });
      // Forcer la mise à jour dans la zone Angular
      this.ngZone.run(() => {
        this.qrDataUrl = dataUrl;
        this.cdr.detectChanges();
      });
    } catch (err) {
      console.error('Erreur génération QR:', err);
      this.snackBar.open('Erreur génération QR code', '✕', {
        duration: 3000,
        panelClass: ['snack-error'],
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    }
  }

  getMenuUrl(menu: MenuRead): string {
    return `${window.location.origin}/menu/${menu.qrToken}`;
  }

  copyLink(): void {
    if (!this.selectedMenu) return;
    navigator.clipboard.writeText(this.getMenuUrl(this.selectedMenu));
    this.snackBar.open('Lien copié ✓', '✕', {
      duration: 2500,
      panelClass: ['snack-success'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  async generatePDF(): Promise<void> {
    if (!this.selectedMenu || !this.qrDataUrl) return;
    this.generating = true;

    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const menu = this.selectedMenu;
      const W = 210;
      const margin = 18;
      let y = 0;

      // ── HEADER fond sombre ─────────────────
      doc.setFillColor(15, 22, 41);
      doc.rect(0, 0, W, 60, 'F');

      doc.setFillColor(236, 72, 153);
      doc.rect(0, 0, W, 3, 'F');

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('MENU PILOT PRO', W / 2, 16, { align: 'center' });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text(menu.name, W / 2, 32, { align: 'center' });

      if (menu.description) {
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(menu.description, W / 2, 41, { align: 'center' });
      }

      if (menu.timeStart && menu.timeEnd) {
        doc.setFillColor(30, 41, 59);
        doc.roundedRect(W / 2 - 25, 45, 50, 9, 2, 2, 'F');
        doc.setTextColor(226, 232, 240);
        doc.setFontSize(8);
        doc.text(`${menu.timeStart} — ${menu.timeEnd}`, W / 2, 50.5, { align: 'center' });
      }

      y = 68;

      // ── QR CODE ────────────────────────────
      const qrSize = 52;
      const qrX = (W - qrSize) / 2;

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(qrX - 4, y - 3, qrSize + 8, qrSize + 18, 4, 4, 'F');

      doc.addImage(this.qrDataUrl, 'PNG', qrX, y, qrSize, qrSize);

      y += qrSize + 4;
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Scannez pour voir le menu', W / 2, y, { align: 'center' });

      y += 4;
      doc.setTextColor(99, 102, 241);
      doc.setFontSize(6.5);
      const url = this.getMenuUrl(menu);
      const shortUrl = url.length > 55 ? url.substring(0, 52) + '...' : url;
      doc.text(shortUrl, W / 2, y, { align: 'center' });

      y += 12;

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, y, W - margin, y);
      y += 8;

      // ── SECTIONS ───────────────────────────
      for (const section of menu.sections) {
        if (y > 260) { doc.addPage(); y = 18; }

        doc.setFillColor(15, 22, 41);
        doc.roundedRect(margin, y, W - margin * 2, 8, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(section.title.toUpperCase(), margin + 4, y + 5.5);
        y += 13;

        if (section.products?.length) {
          for (const p of section.products) {
            if (y > 265) { doc.addPage(); y = 18; }
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, y, W - margin * 2, 8, 'F');
            doc.setTextColor(17, 24, 39);
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.text((p as any).name ?? '', margin + 3, y + 5.3);
            doc.setTextColor(99, 102, 241);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(`${Number((p as any).price ?? 0).toFixed(2)} €`, W - margin - 2, y + 5.3, { align: 'right' });
            doc.setDrawColor(241, 245, 249);
            doc.setLineWidth(0.2);
            doc.line(margin, y + 8, W - margin, y + 8);
            y += 9;
          }
        }

        if (section.packs?.length) {
          for (const pk of section.packs as any[]) {
            if (y > 265) { doc.addPage(); y = 18; }
            doc.setFillColor(255, 251, 235);
            doc.rect(margin, y, W - margin * 2, 8, 'F');
            doc.setFillColor(245, 158, 11);
            doc.roundedRect(margin + 2, y + 1.5, 10, 5, 1, 1, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(5.5);
            doc.setFont('helvetica', 'bold');
            doc.text('PACK', margin + 4, y + 5);
            doc.setTextColor(17, 24, 39);
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.text(pk.name ?? '', margin + 15, y + 5.3);
            doc.setTextColor(245, 158, 11);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(`${Number(pk.price ?? 0).toFixed(2)} €`, W - margin - 2, y + 5.3, { align: 'right' });
            doc.setDrawColor(254, 230, 138);
            doc.setLineWidth(0.2);
            doc.line(margin, y + 8, W - margin, y + 8);
            y += 9;
          }
        }

        y += 5;
      }

      // ── FOOTER ─────────────────────────────
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(248, 250, 252);
        doc.rect(0, 285, W, 12, 'F');
        doc.setTextColor(156, 163, 175);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text('Menu Pilot Pro — menu digital professionnel', margin, 291);
        doc.text(`Page ${i} / ${pageCount}`, W - margin, 291, { align: 'right' });
      }

      const fileName = `menu-${menu.name.toLowerCase().replace(/\s+/g, '-')}-qr.pdf`;
      doc.save(fileName);

      this.snackBar.open('PDF généré ✓', '✕', {
        duration: 3000,
        panelClass: ['snack-success'],
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });

    } catch (err) {
      console.error('Erreur PDF:', err);
      this.snackBar.open('Erreur génération PDF', '✕', {
        duration: 3000,
        panelClass: ['snack-error'],
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    } finally {
      this.generating = false;
    }
  }
}
