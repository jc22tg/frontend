import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PasswordResetFormComponent } from '../../components/password-reset-form/password-reset-form.component';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, PasswordResetFormComponent]
})
export class ForgotPasswordComponent {
  onResetSubmit(event: any) {
    // Implementar lógica de recuperación de contraseña
    console.log('Reset data:', event);
  }
} 
