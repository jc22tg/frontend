import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent, merge, Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  private onlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  public online$: Observable<boolean>;

  constructor() {
    this.initConnectionListeners();
    
    // Crear un observable que combine el estado inicial y los eventos
    this.online$ = merge(
      this.onlineSubject.asObservable(),
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).pipe(
      shareReplay(1) // Compartir el último valor emitido con nuevos suscriptores
    );
    
    // Iniciar verificación periódica de conectividad real
    this.setupPeriodicConnectivityCheck();
  }

  private initConnectionListeners() {
    // Los eventos nativos de online/offline
    window.addEventListener('online', () => {
      this.onlineSubject.next(true);
    });

    window.addEventListener('offline', () => {
      this.onlineSubject.next(false);
    });
  }

  private setupPeriodicConnectivityCheck() {
    // Verificar conectividad real cada 30 segundos cuando se cree que está online
    setInterval(() => {
      if (navigator.onLine) {
        this.checkRealConnectivity();
      }
    }, 30000);
  }

  private async checkRealConnectivity() {
    try {
      // Intentar hacer una petición pequeña para verificar conectividad real
      const response = await fetch('/api/health-check', { 
        method: 'HEAD',
        // Usar un timestamp para evitar caché
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
        // Establecer un timeout corto
        signal: AbortSignal.timeout(5000)
      });
      
      const isOnline = response.ok;
      if (!isOnline && this.onlineSubject.value) {
        // Si la respuesta no es exitosa pero creemos que estamos online, actualizar
        this.onlineSubject.next(false);
      } else if (isOnline && !this.onlineSubject.value) {
        // Si la respuesta es exitosa pero creemos que estamos offline, actualizar
        this.onlineSubject.next(true);
      }
    } catch (error) {
      // Si hay un error de red, considerar que estamos offline
      if (this.onlineSubject.value) {
        this.onlineSubject.next(false);
      }
    }
  }

  // Método para verificar conectividad bajo demanda
  public checkConnectivity(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!navigator.onLine) {
        resolve(false);
        return;
      }

      this.checkRealConnectivity().then(() => {
        resolve(this.onlineSubject.value);
      });
    });
  }
} 