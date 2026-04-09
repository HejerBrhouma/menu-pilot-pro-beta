import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GalleryImage } from '../models/gallery.model';

@Injectable({ providedIn: 'root' })
export class GalleryService {
  private readonly url = '/api/gallery';

  constructor(private http: HttpClient) {}

  getByEstablishment(establishmentId: number): Observable<GalleryImage[]> {
    return this.http.get<GalleryImage[]>(`${this.url}?establishment=${establishmentId}`).pipe(
      map(images => images.map(img => ({ ...img, url: this.getImageUrl(img.filename) }))),
      catchError(this.handleError)
    );
  }

  upload(establishmentId: number, file: File, category: string, title?: string): Observable<GalleryImage> {
    const form = new FormData();
    form.append('image', file);
    form.append('category', category);
    if (title) form.append('title', title);
    return this.http.post<GalleryImage>(`${this.url}/${establishmentId}/upload`, form).pipe(
      map(img => ({ ...img, url: this.getImageUrl(img.filename) })),
      catchError(this.handleError)
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  update(id: number, data: Partial<GalleryImage>): Observable<GalleryImage> {
    return this.http.patch<GalleryImage>(`${this.url}/${id}`, data).pipe(
      catchError(this.handleError)
    );
  }

  getImageUrl(filename: string): string {
    return `/uploads/gallery/${filename}`;
  }

  private handleError(error: any): Observable<never> {
    return throwError(() => new Error(error?.error?.error || error?.message || 'Erreur serveur'));
  }
}
