import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="error-container">
      <mat-icon class="error-icon">error_outline</mat-icon>
      <h1>Error</h1>
      <p>Ha ocurrido un error inesperado.</p>
      <button mat-raised-button color="primary" (click)="goBack()">
        Volver
      </button>
    </div>
  `,
  styles: [`
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      text-align: center;
    }
    .error-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      color: #f44336;
      margin-bottom: 16px;
    }
    h1 {
      margin-bottom: 16px;
    }
    p {
      margin-bottom: 24px;
    }
  `]
})
export class ErrorComponent {
  goBack(): void {
    window.history.back();
  }
} 
