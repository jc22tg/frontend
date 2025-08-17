import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-offline',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet
  ],
  template: `
    <div class="offline-container">
      <h1 class="offline-title">Gestión de Modo Offline</h1>
      <div class="offline-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .offline-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .offline-title {
      margin-bottom: 20px;
      color: #333;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    
    .offline-content {
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 20px;
    }
  `]
})
export class OfflineComponent {} 
