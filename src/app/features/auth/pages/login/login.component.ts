import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LoginFormComponent } from '../../components/login-form/login-form.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, LoginFormComponent]
})
export class LoginComponent {
  onLoginSubmit(event: any) {
    // Implementar lógica de login
    console.log('Login data:', event);
  }
} 