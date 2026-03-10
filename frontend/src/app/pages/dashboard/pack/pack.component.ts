// src/app/pages/dashboard/pack/pack.component.ts

import { Component } from '@angular/core';
import { PackListComponent } from './pack-list/pack-list.component';

@Component({
  selector: 'app-packs-page',
  standalone: true,
  imports: [PackListComponent],
  template: `<app-pack-list></app-pack-list>`
})
export class PackComponent {}
