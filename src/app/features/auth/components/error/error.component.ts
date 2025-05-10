import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-auth-error',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="error-container" *ngIf="message">
      <mat-icon>error_outline</mat-icon>
      <span>{{ message }}</span>
    </div>
  `,
  styles: [`
    .error-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #d32f2f;
      background-color: #ffebee;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      margin: 0.5rem 0;

      mat-icon {
        font-size: 1.2rem;
        width: 1.2rem;
        height: 1.2rem;
      }

      span {
        font-size: 0.9rem;
      }
    }
  `]
})
export class ErrorComponent {
  @Input() message: string | null = null;
} 