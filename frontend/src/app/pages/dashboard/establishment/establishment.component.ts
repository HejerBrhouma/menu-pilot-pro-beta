// src/app/pages/dashboard/establishment/establishment.component.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { EstablishmentService } from '../../../core/services/establishment.service';
import { AuthService } from '../../../core/services/auth-service';
import { Establishment, DAYS_FR, DEFAULT_OPENING_HOURS, OpeningHours } from '../../../core/models/establishment.model';
import { GalleryService } from '../../../core/services/gallery.service';
import { GalleryImage, GALLERY_CATEGORIES } from '../../../core/models/gallery.model';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-establishment',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    MatTabsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSlideToggleModule,
    MatSnackBarModule, MatProgressSpinnerModule,
    MatTooltipModule, MatDividerModule
  ],
  templateUrl: './establishment.component.html',
  styleUrls: ['./establishment.component.scss']
})
export class EstablishmentComponent implements OnInit {
  establishment: Establishment | null = null;
  loading  = true;
  saving   = false;

  // Droits selon le rôle
  canManage = false;

  infoForm!: FormGroup;
  themeForm!: FormGroup;
  socialForm!: FormGroup;
  openingHours: OpeningHours = { ...DEFAULT_OPENING_HOURS };
  daysKeys   = Object.keys(DAYS_FR);
  daysLabels = DAYS_FR;

  logoPreview: string | null = null;
  logoFile: File | null = null;

  galleryImages: GalleryImage[] = [];
  galleryCategories = GALLERY_CATEGORIES;
  selectedGalleryCategory = 'Salle';
  galleryUploading = false;
  galleryDeleting: number | null = null;

  constructor(
    private fb: FormBuilder,
    private establishmentService: EstablishmentService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    public galleryService: GalleryService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.canManage = this.authService.canManage();
    this.initForms();
    this.loadEstablishment();
  }

  initForms(): void {
    this.infoForm = this.fb.group({
      name:        ['', [Validators.required, Validators.minLength(2)]],
      slug:        ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      description: [''],
      email:       ['', Validators.email],
      phone:       [''],
      address:     [''],
      city:        [''],
      country:     [''],
    });

    this.themeForm = this.fb.group({
      primaryColor:   ['#6366f1'],
      secondaryColor: ['#ec4899'],
    });

    this.socialForm = this.fb.group({
      website:   [''],
      instagram: [''],
      facebook:  [''],
    });
  }

  loadEstablishment(): void {
    this.loading = true;
    this.establishmentService.getAll().subscribe({
      next: (items) => {
        if (items.length > 0) {
          this.establishment = items[0];
          this.patchForms(this.establishment);
          this.loadGallery(this.establishment!.id!);
          if (this.establishment.openingHours) {
            this.openingHours = { ...DEFAULT_OPENING_HOURS, ...this.establishment.openingHours };
          }
          if (this.establishment.logo) {
            this.logoPreview = this.establishmentService.getLogoUrl(this.establishment.logo);
          }
          if (this.establishment.primaryColor || this.establishment.secondaryColor) {
            this.themeService.apply(
              this.establishment.primaryColor ?? '#6366f1',
              this.establishment.secondaryColor ?? '#8b5cf6'
            );
          }
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  patchForms(e: Establishment): void {
    this.infoForm.patchValue({
      name: e.name, slug: e.slug, description: e.description,
      email: e.email, phone: e.phone, address: e.address,
      city: e.city, country: e.country
    });
    this.themeForm.patchValue({
      primaryColor: e.primaryColor, secondaryColor: e.secondaryColor
    });
    this.socialForm.patchValue({
      website: e.website, instagram: e.instagram, facebook: e.facebook
    });

    // Désactiver tous les formulaires si lecture seule
    if (!this.canManage) {
      this.infoForm.disable();
      this.themeForm.disable();
      this.socialForm.disable();
    }
  }

  onLogoChange(event: Event): void {
    if (!this.canManage) return;
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.logoFile = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      this.logoPreview = e.target?.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(this.logoFile);
  }

  toggleDay(day: string): void {
    if (!this.canManage) return;
    (this.openingHours as any)[day].closed = !(this.openingHours as any)[day].closed;
  }

  saveInfo(): void {
    if (!this.canManage || this.infoForm.invalid) return;
    this.saving = true;
    const data = this.infoForm.value;

    const save$ = this.establishment?.id
      ? this.establishmentService.update(this.establishment.id, data)
      : this.establishmentService.create({ ...data, isActive: true });

    save$.subscribe({
      next: (result) => {
        this.establishment = result;
        if (this.logoFile && result.id) {
          this.establishmentService.uploadLogo(result.id, this.logoFile).subscribe({
            next: (r) => {
              this.logoPreview = r.url;
              this.logoFile = null;
              this.cdr.detectChanges();
            }
          });
        }
        this.saving = false;
        this.notify('Informations sauvegardées ✓');
        this.cdr.detectChanges();
      },
      error: (err) => { this.saving = false; this.notify(err.message, 'error'); }
    });
  }

  saveTheme(): void {
    if (!this.canManage || !this.establishment?.id) return;
    this.saving = true;
    const { primaryColor, secondaryColor } = this.themeForm.value;
    this.establishmentService.update(this.establishment.id, this.themeForm.value).subscribe({
      next: () => {
        this.saving = false;
        this.themeService.apply(primaryColor, secondaryColor);
        this.notify('Thème sauvegardé ✓');
      },
      error: (err) => { this.saving = false; this.notify(err.message, 'error'); }
    });
  }

  saveHoraires(): void {
    if (!this.canManage || !this.establishment?.id) return;
    this.saving = true;
    this.establishmentService.update(this.establishment.id, { openingHours: this.openingHours }).subscribe({
      next: () => { this.saving = false; this.notify('Horaires sauvegardés ✓'); },
      error: (err) => { this.saving = false; this.notify(err.message, 'error'); }
    });
  }

  saveSocial(): void {
    if (!this.canManage || !this.establishment?.id) return;
    this.saving = true;
    this.establishmentService.update(this.establishment.id, this.socialForm.value).subscribe({
      next: () => { this.saving = false; this.notify('Réseaux sociaux sauvegardés ✓'); },
      error: (err) => { this.saving = false; this.notify(err.message, 'error'); }
    });
  }

  getPublicUrl(): string {
    return `${window.location.origin}/${this.establishment?.slug}`;
  }

  copyPublicUrl(): void {
    navigator.clipboard.writeText(this.getPublicUrl());
    this.notify('Lien copié ✓');
  }

  loadGallery(estId: number): void {
    this.galleryService.getByEstablishment(estId).subscribe({
      next: (imgs) => { this.galleryImages = imgs; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  getGalleryByCategory(category: string): GalleryImage[] {
    return this.galleryImages.filter(img => img.category === category);
  }

  onGalleryFilesSelected(event: Event): void {
    if (!this.canManage || !this.establishment?.id) return;
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.galleryUploading = true;
    const uploads = Array.from(input.files).map(file =>
      this.galleryService.upload(this.establishment!.id!, file, this.selectedGalleryCategory)
        .toPromise()
    );
    Promise.allSettled(uploads).then((results) => {
      this.galleryUploading = false;
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      this.loadGallery(this.establishment!.id!);
      if (succeeded > 0) this.notify(`${succeeded} image(s) ajoutée(s) ✓`);
      else this.notify('Échec de l\'upload', 'error');
      input.value = '';
      this.cdr.detectChanges();
    });
  }

  deleteGalleryImage(img: GalleryImage): void {
    if (!this.canManage) return;
    this.galleryDeleting = img.id;
    this.galleryService.delete(img.id).subscribe({
      next: () => {
        this.galleryImages = this.galleryImages.filter(i => i.id !== img.id);
        this.galleryDeleting = null;
        this.cdr.detectChanges();
      },
      error: () => { this.galleryDeleting = null; this.notify('Erreur suppression', 'error'); }
    });
  }

  private notify(message: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(message, '✕', {
      duration: 3500,
      panelClass: type === 'error' ? ['snack-error'] : ['snack-success'],
      horizontalPosition: 'end', verticalPosition: 'top'
    });
  }
}
