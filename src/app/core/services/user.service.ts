import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer'
}

export interface UserPreferences {
  id: string;
  userId: string;
  mapDefaultView?: {
    zoom: number;
    center: {
      lat: number;
      lng: number;
    }
  };
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {}

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/users/me`);
  }

  updateUser(userId: string, userData: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${environment.apiUrl}/users/${userId}`, userData);
  }

  changePassword(oldPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/users/change-password`, {
      oldPassword,
      newPassword
    });
  }

  updatePreferences(userId: string, preferences: Partial<UserPreferences>): Observable<User> {
    return this.http.patch<User>(`${environment.apiUrl}/users/${userId}/preferences`, preferences);
  }
} 