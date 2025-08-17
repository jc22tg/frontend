import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoggerService } from '../../../../core/services/logger.service';

/**
 * Componente de redirección para mantener compatibilidad con código existente
 * Simplemente redirige al usuario al nuevo componente MapContainerComponent
 */
@Component({
  selector: 'app-network-map-redirect',
  standalone: true,
  template: `<div>Redireccionando...</div>`,
})
export class NetworkMapRedirectComponent implements OnInit {
  constructor(
    private router: Router,
    private logger: LoggerService
  ) {}
  
  ngOnInit(): void {
    this.logger.info('Redirigiendo a la nueva implementación del mapa');
    this.router.navigate(['/network-design/map']);
  }
} 
