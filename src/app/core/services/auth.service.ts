import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of, from } from 'rxjs';
import { tap, catchError, delay, map, finalize, shareReplay } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { User, RefreshTokenResponse, LoginResponse } from '../../features/auth/types/auth.types';
import { UserRole } from '../../shared/models/user.model';
import { AuthMapperService } from './auth-mapper.service';

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

interface BackendResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

// Usuarios de prueba para desarrollo
const MOCK_USERS = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  },
  {
    id: 2,
    username: 'operador',
    password: 'operador123',
    firstName: 'Operador',
    lastName: 'User',
    email: 'operador@example.com',
    role: UserRole.OPERATOR,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  },
  {
    id: 3,
    username: 'tecnico',
    password: 'tecnico123',
    firstName: 'Técnico',
    lastName: 'User',
    email: 'tecnico@example.com',
    role: UserRole.TECHNICIAN,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  },
];

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';
const TOKEN_EXPIRATION_KEY = 'tokenExpiration';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private useMock = false; // Cambiar a false para usar el backend real
  private refreshTokenTimeout: any;
  private isRefreshing = false;
  private authCheckPromise: Promise<boolean> | null = null;
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authMapperService: AuthMapperService
  ) {
    console.log('AuthService constructor called');
    this.initializeAuth();
  }

  private initializeAuth(): void {
    try {
      const token = this.getToken();
      if (!token) {
        console.log('No token found in storage');
        return;
      }

      const user = this.getCurrentUserFromStorage();
      if (!user) {
        console.log('No user found in storage');
        this.clearAuthData();
        return;
      }

      const isTokenValid = this.tokenExpirationCheck(token);
      if (!isTokenValid) {
        console.log('Token is invalid or expired');
        this.clearAuthData();
        return;
      }

      this.currentUserSubject.next(user);
      this.startRefreshTokenTimer();
      console.log('Auth initialized successfully');
    } catch (error) {
      console.error('Error initializing auth:', error);
      this.clearAuthData();
    }
  }

  checkAuthStatus(): Observable<boolean> {
    console.log('Checking auth status...');
    
    // Si ya hay una verificación en curso, retornamos la misma promesa
    if (this.authCheckPromise) {
      return from(this.authCheckPromise);
    }

    this.authCheckPromise = new Promise<boolean>(async (resolve) => {
      try {
        const token = this.getToken();
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        const user = this.getCurrentUserFromStorage();

        if (!token || !refreshToken) {
          console.log('No tokens found');
          this.clearAuthData();
          resolve(false);
          return;
        }

        if (!this.isTokenValid(token)) {
          console.log('Token is invalid or expired');
          if (refreshToken) {
            try {
              const response = await this.refreshToken().toPromise();
              if (response) {
                this.handleAuthResponse(response);
                resolve(true);
                return;
              }
            } catch (error) {
              console.error('Error refreshing token:', error);
              this.clearAuthData();
            }
          }
          resolve(false);
          return;
        }

        if (user) {
          console.log('Valid session found');
          this.currentUserSubject.next(user);
          this.startRefreshTokenTimer();
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        this.clearAuthData();
        resolve(false);
      }
    }).finally(() => {
      this.authCheckPromise = null;
    });

    return from(this.authCheckPromise).pipe(shareReplay(1));
  }

  login(email: string, password: string): Observable<AuthResponse> {
    console.log('Login attempt for:', email);
    
    if (this.useMock) {
      console.log('Using mock authentication');
      const user = MOCK_USERS.find(
        (u) => u.email === email && u.password === password
      );

      if (user) {
        console.log('Mock user found, creating session');
        const { password, ...userWithoutPassword } = user;
        const response: AuthResponse = {
          user: { ...userWithoutPassword, id: String(userWithoutPassword.id) },
          token: 'mock-jwt-token-' + Math.random().toString(36).substring(2, 15),
          refreshToken: 'mock-refresh-token',
          expiresIn: 3600,
        };

        this.handleAuthResponse(response);
        return of(response).pipe(delay(500));
      }

      console.log('Mock user not found');
      return throwError(() => new Error('Credenciales inválidas'));
    }

    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, {
        email,
        password,
      })
      .pipe(
        tap((response) => {
          console.log('Login response from backend:', JSON.stringify(response, null, 2));
          if (!response.user) {
            throw new Error('Respuesta de login inválida: falta usuario');
          }
          if (!response.token) {
            throw new Error('Respuesta de login inválida: falta token');
          }
          if (!response.expiresIn) {
            throw new Error('Respuesta de login inválida: falta expiresIn');
          }
          console.log('Login successful');
          this.handleAuthResponse(response);
        }),
        catchError((error) => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    this.clearAuthData();
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    
    if (!refreshToken) {
      this.clearAuthData();
      return throwError(() => new Error('No hay refresh token disponible'));
    }
    
    if (this.isRefreshing) {
      return throwError(() => new Error('Ya hay un proceso de refresco en curso'));
    }
    
    this.isRefreshing = true;
    
    return this.http.post<RefreshTokenResponse>(
      `${this.apiUrl}/refresh`, 
      { refreshToken }
    ).pipe(
      tap((response: RefreshTokenResponse) => {
        // Guardar el nuevo token y actualizar la expiración
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
        
        if (response.expiresIn) {
          const expirationDate = new Date();
          expirationDate.setSeconds(expirationDate.getSeconds() + response.expiresIn);
          localStorage.setItem(TOKEN_EXPIRATION_KEY, expirationDate.toISOString());
        }
        
        // Si tenemos información del usuario en local storage, actualizamos solo el token
        const currentUser = this.getCurrentUserFromStorage();
        if (currentUser) {
          this.currentUserSubject.next(currentUser);
        }
        
        this.startRefreshTokenTimer();
      }),
      catchError((error: HttpErrorResponse) => {
        // Limpiar el storage en caso de error de refresco
        this.clearAuthData();
        return throwError(() => error);
      }),
      finalize(() => {
        this.isRefreshing = false;
      })
    );
  }

  register(user: Partial<User>): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${environment.apiUrl}/auth/register`,
      user
    );
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/request-password-reset`, {
      email,
    });
  }

  resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string
  ): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/reset-password`, {
      token,
      newPassword,
      confirmPassword,
    });
  }

  changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/change-password`, {
      currentPassword,
      newPassword,
      confirmPassword,
    });
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    return this.http
      .put<User>(`${environment.apiUrl}/auth/profile`, userData)
      .pipe(
        tap((user) => {
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          this.currentUserSubject.next(user);
        })
      );
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const isValid = token ? this.isTokenValid(token) : false;
    console.log('Authentication check:', isValid ? 'authenticated' : 'not authenticated');
    return isValid;
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.role) return false;
    
    return user.role === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.role) return false;
    
    return roles.includes(user.role);
  }

  private handleAuthResponse(response: AuthResponse | RefreshTokenResponse): void {
    console.log('Handling auth response');
    try {
      // Si es una respuesta de refresh token (no contiene user)
      if (!('user' in response)) {
        // Solo actualizamos tokens
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
        
        if (response.expiresIn) {
          const expirationDate = new Date();
          expirationDate.setSeconds(expirationDate.getSeconds() + response.expiresIn);
          localStorage.setItem(TOKEN_EXPIRATION_KEY, expirationDate.toISOString());
        }
        
        const currentUser = this.getCurrentUserFromStorage();
        if (currentUser) {
          this.currentUserSubject.next(currentUser);
        }
        
        console.log('Token refreshed successfully');
        return;
      }
      
      // Si es una respuesta completa de login
      if (!response.user || !response.token || !response.refreshToken) {
        console.error('Invalid auth response');
        this.clearAuthData();
        return;
      }

      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      console.log('Auth data stored in localStorage');
      
      this.currentUserSubject.next(response.user);
      this.startRefreshTokenTimer();
      console.log('Session initialized successfully');
    } catch (error) {
      console.error('Error storing auth data:', error);
      this.clearAuthData();
    }
  }

  private startRefreshTokenTimer(): void {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }

    const token = this.getToken();
    if (!token) return;

    const tokenExp = this.getTokenExpiration(token);
    const timeout = tokenExp.getTime() - Date.now() - (60 * 1000);

    if (timeout > 0) {
      console.log('Scheduling token refresh in', timeout, 'ms');
      this.refreshTokenTimeout = setTimeout(() => {
        console.log('Refreshing token...');
        this.refreshToken().subscribe({
          error: (error) => console.error('Error refreshing token:', error)
        });
      }, timeout);
    } else {
      console.log('Token expired, refreshing immediately...');
      this.refreshToken().subscribe({
        error: (error) => console.error('Error refreshing token:', error)
      });
    }
  }

  private getTokenExpiration(token: string): Date {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return new Date();
    }
    return new Date(decoded.exp * 1000);
  }

  private decodeToken(token: string): any {
    try {
      if (!token || typeof token !== 'string') {
        console.error('Token inválido:', token);
        return null;
      }

      // Verificar que el token tenga el formato correcto (tres partes separadas por puntos)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Token mal formado:', token);
        return null;
      }

      // Decodificar la parte del payload (segunda parte)
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const decoded = JSON.parse(jsonPayload);
      console.log('Token decoded successfully');
      return decoded;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  private handleError(error: any) {
    console.error('Error en autenticación:', error);
    return throwError(() => error);
  }

  private isTokenValid(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        console.log('Token is invalid (no expiration)');
        return false;
      }
      const isValid = new Date(decoded.exp * 1000) > new Date();
      console.log('Token validity:', isValid);
      return isValid;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }

  private getCurrentUserFromStorage(): User | null {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      if (!userStr || userStr === 'undefined' || userStr === 'null') {
        console.log('No valid user found in storage');
        return null;
      }
      const user = JSON.parse(userStr);
      if (!user || typeof user !== 'object') {
        console.log('Invalid user data in storage');
        return null;
      }
      
      // Asegurar que el usuario tenga la propiedad username
      if (!user.username) {
        user.username = user.email ? user.email.split('@')[0] : '';
      }
      
      console.log('User retrieved from storage');
      return user;
    } catch (error) {
      console.error('Error getting user from storage:', error);
      this.clearAuthData(); // Limpiar datos inválidos
      return null;
    }
  }

  private clearAuthData(): void {
    console.log('Clearing auth data');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_EXPIRATION_KEY);
    this.currentUserSubject.next(null);
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }

  private tokenExpirationCheck(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        console.log('Token is invalid (no expiration)');
        return false;
      }
      const isValid = new Date(decoded.exp * 1000) > new Date();
      console.log('Token validity:', isValid);
      return isValid;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return false;
    }
  }

  // Mock users for development
  private mockUsers: User[] = [
    {
      id: '1',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      isActive: true
    },
    {
      id: '2',
      username: 'user',
      firstName: 'Regular',
      lastName: 'User',
      email: 'user@example.com',
      role: UserRole.VIEWER,
      createdAt: new Date('2023-01-02'),
      updatedAt: new Date('2023-01-02'),
      isActive: true
    },
    {
      id: '3',
      username: 'tech',
      firstName: 'Tech',
      lastName: 'User',
      email: 'tech@example.com',
      role: UserRole.TECHNICIAN,
      createdAt: new Date('2023-01-03'),
      updatedAt: new Date('2023-01-03'),
      isActive: true
    }
  ];

  private createMockUser(email: string, role = UserRole.VIEWER): User {
    return {
      id: (Math.random() * 1000).toFixed(0),
      username: email.split('@')[0],
      firstName: 'New',
      lastName: 'User',
      email,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };
  }
}
