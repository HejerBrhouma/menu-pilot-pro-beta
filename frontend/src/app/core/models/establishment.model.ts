// src/app/core/models/establishment.model.ts

export interface OpeningHourDay {
  open: string;    // "08:00"
  close: string;   // "22:00"
  closed: boolean;
}

export interface OpeningHours {
  monday:    OpeningHourDay;
  tuesday:   OpeningHourDay;
  wednesday: OpeningHourDay;
  thursday:  OpeningHourDay;
  friday:    OpeningHourDay;
  saturday:  OpeningHourDay;
  sunday:    OpeningHourDay;
  [key: string]: OpeningHourDay;  // ← index signature
}

export interface Establishment {
  '@id'?:          string;
  id?:             number;
  name:            string;
  slug:            string;
  description?:    string;
  email?:          string;
  phone?:          string;
  address?:        string;
  city?:           string;
  country?:        string;
  logo?:           string;
  primaryColor?:   string;
  secondaryColor?: string;
  openingHours?:   OpeningHours;
  website?:        string;
  instagram?:      string;
  facebook?:       string;
  isActive:        boolean;
  maxUsers:        number;
  owner?:          string;
  createdAt?:      string;
  updatedAt?:      string;
}

export const DAYS_FR: Record<string, string> = {
  monday:    'Lundi',
  tuesday:   'Mardi',
  wednesday: 'Mercredi',
  thursday:  'Jeudi',
  friday:    'Vendredi',
  saturday:  'Samedi',
  sunday:    'Dimanche',
};

export const DEFAULT_OPENING_HOURS: OpeningHours = {
  monday:    { open: '08:00', close: '22:00', closed: false },
  tuesday:   { open: '08:00', close: '22:00', closed: false },
  wednesday: { open: '08:00', close: '22:00', closed: false },
  thursday:  { open: '08:00', close: '22:00', closed: false },
  friday:    { open: '08:00', close: '22:00', closed: false },
  saturday:  { open: '10:00', close: '23:00', closed: false },
  sunday:    { open: '10:00', close: '22:00', closed: false },
};
