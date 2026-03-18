// src/app/pages/super-admin/dashboard/super-admin-dashboard.component.ts

import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EstablishmentService } from '../../../core/services/establishment.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './super-admin-dashboard.component.html',
  styleUrls: ['./super-admin-dashboard.component.scss']
})
export class SuperAdminDashboardComponent implements OnInit {
  totalEstablishments  = 0;
  activeEstablishments = 0;
  inactiveEstablishments = 0;
  totalUsers           = 0;
  activeUsers          = 0;
  loading              = true;

  private establishmentService = inject(EstablishmentService);
  private userService          = inject(UserService);
  private cdr                  = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.establishmentService.getAll().subscribe({
      next: (items) => {
        this.totalEstablishments   = items.length;
        this.activeEstablishments  = items.filter(e => e.isActive).length;
        this.inactiveEstablishments = items.filter(e => !e.isActive).length;
        this.cdr.detectChanges();
      }
    });

    this.userService.getAll().subscribe({
      next: (users) => {
        this.totalUsers  = users.length;
        this.activeUsers = users.filter(u => u.isActive).length;
        this.loading     = false;
        this.cdr.detectChanges();
      }
    });
  }
}
