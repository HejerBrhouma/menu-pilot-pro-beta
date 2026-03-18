// src/app/core/models/user.model.ts

export interface AppUser {
  '@id'?:         string;
  id?:            number;
  email:          string;
  firstName:      string;
  lastName?:      string;
  roles:          string[];
  isActive:       boolean;
  establishment?: string;  // IRI ex: "/api/establishments/1"
  googleId?:      string;
}

export const ROLES_OPTIONS = [
  { value: 'ROLE_ADMIN',   label: 'Administrateur' },
  { value: 'ROLE_MANAGER', label: 'Manager' },
  { value: 'ROLE_WAITER',  label: 'Serveur' },
];

export function getRoleLabel(roles: string[]): string {
  if (roles.includes('ROLE_SUPER_ADMIN')) return 'Super Admin';
  if (roles.includes('ROLE_ADMIN'))       return 'Admin';
  if (roles.includes('ROLE_MANAGER'))     return 'Manager';
  if (roles.includes('ROLE_WAITER'))      return 'Serveur';
  return 'Utilisateur';
}

export function getRoleColor(roles: string[]): string {
  if (roles.includes('ROLE_SUPER_ADMIN')) return '#f59e0b';
  if (roles.includes('ROLE_ADMIN'))       return '#6366f1';
  if (roles.includes('ROLE_MANAGER'))     return '#10b981';
  if (roles.includes('ROLE_WAITER'))      return '#3b82f6';
  return '#9ca3af';
}
