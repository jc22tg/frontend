import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../core/store';
import * as AuthActions from '../../../../core/store/actions/auth.actions';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CommonModule,
  ],
  template: `
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
      <h1 class="login-title">Iniciar Sesión</h1>
      <div *ngIf="error$ | async as error" class="error-message">
        {{ error }}
      </div>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Email</mat-label>
        <input
          matInput
          formControlName="email"
          type="email"
          required
          title="Email"
          placeholder="Ingrese su email"
        />
        <mat-icon matSuffix>person</mat-icon>
        <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
          El email es requerido
        </mat-error>
        <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
          Por favor, ingrese un email válido
        </mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Contraseña</mat-label>
        <input
          matInput
          formControlName="password"
          [type]="hidePassword ? 'password' : 'text'"
          required
          title="Contraseña"
          placeholder="Ingrese su contraseña"
        />
        <button type="button" mat-icon-button matSuffix (click)="togglePasswordVisibility()" tabindex="-1">
          <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
        <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
          La contraseña es requerida
        </mat-error>
      </mat-form-field>

      <button
        mat-raised-button
        color="primary"
        type="submit"
        [disabled]="!loginForm.valid || (loading$ | async)"
        class="full-width"
      >
        <span *ngIf="!(loading$ | async)">Iniciar Sesión</span>
        <mat-spinner
          *ngIf="loading$ | async"
          [diameter]="24"
          class="spinner"
        ></mat-spinner>
      </button>
    </form>
  `,
  styles: [
    `
      .login-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
        max-width: 400px;
        padding: 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .login-title {
        text-align: center;
        margin-bottom: 1rem;
        color: #3f51b5;
      }

      .error-message {
        color: #f44336;
        padding: 0.5rem;
        margin-bottom: 1rem;
        border: 1px solid #f44336;
        border-radius: 4px;
        background-color: #ffebee;
      }

      .full-width {
        width: 100%;
      }

      .spinner {
        margin: 0 auto;
      }
    `,
  ],
})
export class LoginFormComponent {
  loginForm: FormGroup;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  hidePassword = true;

  constructor(
    private fb: FormBuilder, 
    private store: Store<AppState>,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    // Para pruebas/desarrollo
    this.loginForm.setValue({
      email: 'admin@example.com',
      password: 'Admin123!'
    });

    this.loading$ = this.store.select(state => state?.auth?.loading ?? false);
    this.error$ = this.store.select(state => state?.auth?.error ?? null);
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.store.dispatch(AuthActions.login({ email, password }));
      
      // Suscribirse al estado de autenticación
      this.store.select(state => state.auth).subscribe(authState => {
        if (authState?.user) {
          this.router.navigate(['/dashboard']);
        }
      });
    }
  }
}
