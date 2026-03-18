// src/app/shared/impersonation-banner/impersonation-banner.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ImpersonateService } from '../../core/services/impersonate.service';
import { AuthService } from '../../core/services/auth-service';

@Component({
  selector: 'app-impersonation-banner',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './impersonation-banner.component.html',
  styleUrls: ['./impersonation-banner.component.scss']
})
export class ImpersonationBannerComponent implements OnInit {
  isImpersonating = false;
  impersonatedName = '';

  private impersonateService = inject(ImpersonateService);
  private authService        = inject(AuthService);

  ngOnInit(): void {
    this.isImpersonating = this.impersonateService.isImpersonating();
    if (this.isImpersonating) {
      const user = this.authService.getCurrentUser();
      this.impersonatedName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
        || user?.email || '';
    }
  }

  stopImpersonation(): void {
    this.impersonateService.stopImpersonation();
  }
}
