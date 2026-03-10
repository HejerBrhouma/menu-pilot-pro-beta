
// src/app/core/models/auth.model.ts

export interface User {
  id?: number;
  '@id'?: string;
  email: string;
  firstName: string;
  lastName?: string;
  roles: string[];
  isActive?: boolean;
}

export interface AuthResponse {
  token: string;
  refresh_token: string;
  user?: User; // optionnel selon ta config Symfony
}
