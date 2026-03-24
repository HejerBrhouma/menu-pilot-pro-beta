// src/app/core/services/product-image.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductImageService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8008';

  getImageUrl(image: string | null | undefined): string | null {
    if (!image) return null;
    return `${this.baseUrl}/uploads/products/${image}`;
  }

  uploadImage(productId: number, file: File): Observable<{ image: string; imageUrl: string }> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<{ image: string; imageUrl: string }>(
      `/api/products/${productId}/image`,
      formData
    );
  }

  deleteImage(productId: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`/api/products/${productId}/image`);
  }
}
