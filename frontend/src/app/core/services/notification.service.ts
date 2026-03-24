// src/app/core/services/notification.service.ts

import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private audioCtx: AudioContext | null = null;

  // ── Son de notification ───────────────────────────────────────────

  playSound(type: 'success' | 'confirmed' | 'served'): void {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode   = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      switch (type) {
        case 'success':
          // Ding simple
          oscillator.frequency.setValueAtTime(880, ctx.currentTime);
          oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.5);
          break;

        case 'confirmed':
          // Double ding
          oscillator.frequency.setValueAtTime(660, ctx.currentTime);
          oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
          gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.6);
          break;

        case 'served':
          // Triple ding joyeux
          oscillator.frequency.setValueAtTime(523, ctx.currentTime);
          oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.35, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.8);
          break;
      }
    } catch (e) {
      // AudioContext non supporté — pas grave
    }
  }

  // ── Vibration ─────────────────────────────────────────────────────

  vibrate(pattern: 'soft' | 'medium' | 'strong'): void {
    if (!('vibrate' in navigator)) return;
    switch (pattern) {
      case 'soft':   navigator.vibrate(50);         break;
      case 'medium': navigator.vibrate([100, 50, 100]); break;
      case 'strong': navigator.vibrate([200, 100, 200, 100, 200]); break;
    }
  }

  // ── Notification selon le statut ──────────────────────────────────

  notifyStatusChange(status: string): void {
    switch (status) {
      case 'CONFIRMED':
        this.playSound('confirmed');
        this.vibrate('medium');
        break;
      case 'SERVED':
        this.playSound('served');
        this.vibrate('strong');
        break;
      case 'PAID':
        this.playSound('success');
        this.vibrate('soft');
        break;
      case 'CANCELLED':
        this.vibrate('strong');
        break;
    }
  }
}
