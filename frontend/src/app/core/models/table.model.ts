export interface Table {
  '@id'?: string;
  id?: number;
  name: string;
  capacity: number;
  isActive: boolean;
  status: 'FREE' | 'OCCUPIED' | 'RESERVED';
  iri?: string; // ✅ AJOUT
}
