import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register-form',
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
    <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Nombre</mat-label>
        <input matInput formControlName="name" required
               title="Nombre completo" placeholder="Ingrese su nombre completo">
        <mat-icon matSuffix>person</mat-icon>
        <mat-error *ngIf="registerForm.get('name')?.hasError('required')">
          El nombre es requerido
        </mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Email</mat-label>
        <input matInput formControlName="email" type="email" required
               title="Email de usuario" placeholder="Ingrese su email">
        <mat-icon matSuffix>email</mat-icon>
        <mat-error *ngIf="registerForm.get('email')?.hasError('required')">
          El email es requerido
        </mat-error>
        <mat-error *ngIf="registerForm.get('email')?.hasError('email')">
          Ingrese un email válido
        </mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Contraseña</mat-label>
        <input matInput formControlName="password" type="password" required
               title="Contraseña" placeholder="Ingrese su contraseña">
        <mat-icon matSuffix>lock</mat-icon>
        <mat-error *ngIf="registerForm.get('password')?.hasError('required')">
          La contraseña es requerida
        </mat-error>
        <mat-error *ngIf="registerForm.get('password')?.hasError('minlength')">
          La contraseña debe tener al menos 6 caracteres
        </mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Confirmar Contraseña</mat-label>
        <input matInput formControlName="confirmPassword" type="password" required
               title="Confirmar contraseña" placeholder="Confirme su contraseña">
        <mat-icon matSuffix>lock</mat-icon>
        <mat-error *ngIf="registerForm.get('confirmPassword')?.hasError('required')">
          La confirmación de contraseña es requerida
        </mat-error>
        <mat-error *ngIf="registerForm.hasError('passwordMismatch')">
          Las contraseñas no coinciden
        </mat-error>
      </mat-form-field>

      <button mat-raised-button color="primary" type="submit" 
              [disabled]="!registerForm.valid" class="full-width">
        Registrarse
      </button>
    </form>
  `,
  styles: [`
    .register-form {
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
  `]
})
export class RegisterFormComponent {
  registerForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.registerForm.valid) {
      // Implementar lógica de registro
      console.log(this.registerForm.value);
    }
  }
} 
