// src/app/pages/dashboard/menu/menu.component.ts

import { Component } from '@angular/core';
import { MenuListComponent } from './menu-list/menu-list.component';

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [MenuListComponent],
  template: `<app-menu-list></app-menu-list>`
})
export class MenuComponent {}
