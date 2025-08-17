import { Injectable } from '@angular/core';
import { User as ModelUser, UserPreferences } from '../../shared/models/user.model';
import { User as AuthUser } from '../../features/auth/types/auth.types';

/**
 * Servicio para mapear entre las diferentes interfaces de usuario
 * utilizadas en la aplicación.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthMapperService {
  
  /**
   * Convierte un usuario del modelo auth.types.ts a user.model.ts
   * @param authUser Usuario del módulo de autenticación
   * @returns Usuario del modelo compartido o null si no hay usuario
   */
  mapAuthUserToModelUser(authUser: AuthUser): ModelUser | null {
    if (!authUser) return null;
    
    return {
      id: authUser.id,
      email: authUser.email,
      username: authUser.username || authUser.email.split('@')[0], // Usar parte del email como username si no existe
      firstName: authUser.firstName,
      lastName: authUser.lastName,
      role: authUser.role,
      createdAt: authUser.createdAt,
      updatedAt: authUser.updatedAt,
      isActive: authUser.isActive,
      // Otros campos que no están en AuthUser se mantienen como undefined o valor por defecto
      preferences: {} as UserPreferences
    };
  }

  /**
   * Convierte un usuario del modelo user.model.ts a auth.types.ts
   * @param modelUser Usuario del modelo compartido
   * @returns Usuario del módulo de autenticación o null si no hay usuario
   */
  mapModelUserToAuthUser(modelUser: ModelUser): AuthUser | null {
    if (!modelUser) return null;
    
    return {
      id: modelUser.id,
      email: modelUser.email,
      username: modelUser.username,
      firstName: modelUser.firstName,
      lastName: modelUser.lastName,
      role: modelUser.role,
      createdAt: modelUser.createdAt || new Date(),
      updatedAt: modelUser.updatedAt || new Date(),
      isActive: modelUser.isActive || false,
      // El campo avatar es opcional en AuthUser
    };
  }
} 
