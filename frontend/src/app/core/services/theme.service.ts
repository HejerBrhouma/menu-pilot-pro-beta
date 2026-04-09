// src/app/core/services/theme.service.ts

import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  apply(primaryHex: string, secondaryHex: string): void {
    const root = document.documentElement;
    const p = this.parseHex(primaryHex) ?? { r: 99, g: 102, b: 241 };
    const s = this.parseHex(secondaryHex) ?? { r: 139, g: 92, b: 246 };

    root.style.setProperty('--clr-primary',       this.toHex(p));
    root.style.setProperty('--clr-primary-hover',  this.toHex(this.darken(p, 0.14)));
    root.style.setProperty('--clr-primary-light',  this.toHex(this.lighten(p, 0.92)));
    root.style.setProperty('--clr-primary-mid',    `rgba(${p.r},${p.g},${p.b},0.12)`);
    root.style.setProperty('--clr-secondary',      this.toHex(s));
    root.style.setProperty('--clr-secondary-hover',this.toHex(this.darken(s, 0.14)));
    root.style.setProperty('--clr-secondary-light',this.toHex(this.lighten(s, 0.92)));
    root.style.setProperty('--clr-border-focus',   this.toHex(this.lighten(p, 0.55)));
  }

  reset(): void {
    this.apply('#6366f1', '#8b5cf6');
  }

  // ── Helpers couleur ───────────────────────────────────────────────────────

  private parseHex(hex: string): { r: number; g: number; b: number } | null {
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return null;
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  }

  private toHex({ r, g, b }: { r: number; g: number; b: number }): string {
    return '#' + [r, g, b].map(v => Math.round(Math.min(255, Math.max(0, v)))
      .toString(16).padStart(2, '0')).join('');
  }

  /** Assombrit en mélangeant avec du noir */
  private darken({ r, g, b }: { r: number; g: number; b: number }, amount: number) {
    return {
      r: r * (1 - amount),
      g: g * (1 - amount),
      b: b * (1 - amount),
    };
  }

  /** Éclaircit en mélangeant avec du blanc */
  private lighten({ r, g, b }: { r: number; g: number; b: number }, amount: number) {
    return {
      r: r + (255 - r) * amount,
      g: g + (255 - g) * amount,
      b: b + (255 - b) * amount,
    };
  }
}
