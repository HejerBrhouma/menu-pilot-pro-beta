// src/app/core/models/promotion.model.ts

export type PromoScope     = 'PRODUCT' | 'CATEGORY' | 'PACK' | 'MENU';
export type PromoType      = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type SpecialEvent   = 'NONE' | 'ANNIVERSARY' | 'AID_ADHA' | 'AID_FITR' |
  'FETE_MERES' | 'FETE_PERES' | 'NOEL' | 'NOUVEL_AN' |
  'SAINT_VALENTIN' | 'FETE_NAT_TUN' | 'CUSTOM';
export type ConflictResolution = 'CUMUL' | 'BEST';

export interface Promotion {
  '@id'?:            string;
  id?:               number;
  name:              string;
  description?:      string;
  type:              PromoType;
  value:             number;
  scope:             PromoScope;
  targetIds:         number[];
  startDate?:        string | null;
  endDate?:          string | null;
  startTime?:        string | null;
  endTime?:          string | null;
  recurrenceType:    RecurrenceType;
  recurrenceDays?:   number[] | null;
  specialEvent:      SpecialEvent;
  specialEventDate?: string | null;
  customDates?:      string[] | null;
  isActive:          boolean;
  establishment?:    string;
  createdAt?:        string;
}

export interface PromotionConflict {
  '@id'?:        string;
  id?:           number;
  targetType:    string;
  targetId:      number;
  targetName:    string;
  promotionIds:  number[];
  resolution?:   ConflictResolution | null;
  isResolved:    boolean;
  resolvedAt?:   string;
  autoResolveAt: string;
  createdAt:     string;
}

export const SCOPE_OPTIONS = [
  { value: 'PRODUCT',  label: 'Produit',   icon: 'inventory_2' },
  { value: 'CATEGORY', label: 'Catégorie', icon: 'category' },
  { value: 'PACK',     label: 'Pack',      icon: 'layers' },
  { value: 'MENU',     label: 'Menu',      icon: 'menu_book' },
];

export const TYPE_OPTIONS = [
  { value: 'PERCENTAGE',   label: 'Pourcentage (%)',    icon: 'percent' },
  { value: 'FIXED_AMOUNT', label: 'Montant fixe (TND)', icon: 'payments' },
];

export const RECURRENCE_OPTIONS = [
  { value: 'NONE',    label: 'Aucune (une seule fois ou période fixe)' },
  { value: 'DAILY',   label: 'Chaque jour (dans la période)' },
  { value: 'WEEKLY',  label: 'Certains jours de la semaine' },
  { value: 'MONTHLY', label: 'Chaque mois (même date)' },
  { value: 'YEARLY',  label: 'Chaque année (même date)' },
];

export const DAYS_OPTIONS = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' },
];

export const SPECIAL_EVENT_OPTIONS = [
  { value: 'NONE',           label: 'Aucun événement spécial', icon: 'event' },
  { value: 'ANNIVERSARY',    label: 'Anniversaire de l\'enseigne', icon: 'cake' },
  { value: 'AID_ADHA',       label: 'Aïd Al-Adha', icon: 'star_and_crescent' },
  { value: 'AID_FITR',       label: 'Aïd Al-Fitr', icon: 'star_and_crescent' },
  { value: 'FETE_MERES',     label: 'Fête des mères', icon: 'favorite' },
  { value: 'FETE_PERES',     label: 'Fête des pères', icon: 'man' },
  { value: 'NOEL',           label: 'Noël (25 déc)', icon: 'redeem' },
  { value: 'NOUVEL_AN',      label: 'Nouvel An (1er jan)', icon: 'celebration' },
  { value: 'SAINT_VALENTIN', label: 'Saint-Valentin (14 fév)', icon: 'favorite_border' },
  { value: 'FETE_NAT_TUN',   label: 'Fête Nationale Tunisienne (20 mars)', icon: 'flag' },
  { value: 'CUSTOM',         label: 'Dates personnalisées', icon: 'date_range' },
];
