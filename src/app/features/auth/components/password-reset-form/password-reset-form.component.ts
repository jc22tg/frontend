import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-password-reset-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="reset-form">
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Email</mat-label>
        <input matInput formControlName="email" type="email" required
               title="Email de usuario" placeholder="Ingrese su email">
        <mat-icon matSuffix>email</mat-icon>
        <mat-error *ngIf="resetForm.get('email')?.hasError('required')">
          El email es requerido
        </mat-error>
        <mat-error *ngIf="resetForm.get('email')?.hasError('email')">
          Ingrese un email válido
        </mat-error>
      </mat-form-field>

      <button mat-raised-button color="primary" type="submit" 
              [disabled]="!resetForm.valid" class="full-width">
        Enviar Instrucciones
      </button>

      <p class="reset-message">
        Se enviarán instrucciones a su correo electrónico para restablecer su contraseña.
      </p>
    </form>
  `,
  styles: [`
    .reset-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: 100%;
      max-width: 400px;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .full-width {
      width: 100%;
    }

    .reset-message {
      text-align: center;
      color: #666;
      font-size: 0.9rem;
      margin-top: 1rem;
    }
  `]
})
export class PasswordResetFormComponent {
  resetForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.resetForm.valid) {
      // Implementar lógica de recuperación de contraseña
      console.log(this.resetForm.value);
    }
  }
} 
