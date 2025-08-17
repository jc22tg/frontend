import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-auth-loading',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="loading-container" *ngIf="isLoading">
      <mat-spinner diameter="40"></mat-spinner>
      <span *ngIf="message">{{ message }}</span>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 2rem;

      mat-spinner {
        color: #1976d2;
      }

      span {
        color: #666;
        font-size: 0.9rem;
      }
    }
  `]
})
export class LoadingComponent {
  @Input() isLoading = false;
  @Input() message: string | null = null;
} 
