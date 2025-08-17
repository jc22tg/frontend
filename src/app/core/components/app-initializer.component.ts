import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-initializer',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatProgressSpinner],
  template: `
    <ng-container *ngIf="initialized; else loading">
      <router-outlet></router-outlet>
    </ng-container>
    <ng-template #loading>
      <div class="loading-screen">
        <mat-spinner diameter="48"></mat-spinner>
      </div>
    </ng-template>
  `,
  styles: [`
    .loading-screen {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      width: 100vw;
      background-color: #fafafa;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 9999;
    }
  `]
})
export class AppInitializerComponent implements OnInit {
  initialized = false;

  constructor() {}

  ngOnInit() {
    this.initialized = true;
  }
} 
