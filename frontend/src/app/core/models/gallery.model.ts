export interface GalleryImage {
  id: number;
  filename: string;
  title?: string;
  category: string;
  position: number;
  url: string;
}

export const GALLERY_CATEGORIES = [
  'Salle', 'Terrasse', 'Cuisine', 'Plats', 'Équipe', 'Événements', 'Autre'
];
