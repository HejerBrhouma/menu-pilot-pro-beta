// src/app/layout/layout.ts

import { Component } from '@angular/core';
import { Header } from '../core/components/header/header';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [Header],   // RouterOutlet et ImpersonationBanner sont maintenant dans Header
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {}
