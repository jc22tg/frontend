export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  TECHNICIAN = 'technician',
  VIEWER = 'viewer'
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date;
  isActive?: boolean;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  language?: string;
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email?: boolean;
    push?: boolean;
  };
  mapDefaultView?: {
    zoom?: number;
    center?: {
      lat: number;
      lng: number;
    }
  };
  dashboardLayout?: string;
} 