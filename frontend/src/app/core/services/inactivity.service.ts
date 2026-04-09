// src/app/core/services/inactivity.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InactivityService {

  private inactivitySubject = new Subject<void>();
  inactivityDetected$ = this.inactivitySubject.asObservable();

  private timer: any        = null;
  private listening         = false;
  private thresholdMs       = 10 * 60 * 1000; // 10 min par défaut
  private readonly boundReset = () => this.reset();
  private readonly EVENTS     = ['click', 'keydown', 'touchstart'];

  /** Démarre la surveillance. thresholdMinutes = seuil configurable */
  start(thresholdMinutes = 10): void {
    if (this.listening) return;
    this.thresholdMs = thresholdMinutes * 60 * 1000;
    this.listening   = true;
    this.EVENTS.forEach(e =>
      document.addEventListener(e, this.boundReset, { passive: true })
    );
    this.scheduleTimer();
  }

  /** Arrête la surveillance */
  stop(): void {
    if (!this.listening) return;
    this.listening = false;
    this.EVENTS.forEach(e =>
      document.removeEventListener(e, this.boundReset)
    );
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
  }

  /** Réinitialise le timer (appelé sur chaque interaction) */
  reset(): void {
    if (!this.listening) return;
    if (this.timer) clearTimeout(this.timer);
    this.scheduleTimer();
  }

  private scheduleTimer(): void {
    this.timer = setTimeout(() => {
      this.inactivitySubject.next();
    }, this.thresholdMs);
  }
}
