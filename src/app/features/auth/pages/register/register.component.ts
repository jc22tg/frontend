import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RegisterFormComponent } from '../../components/register-form/register-form.component';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, RegisterFormComponent]
})
export class RegisterComponent {
  onRegisterSubmit(event: any) {
    // Implementar lógica de registro
    console.log('Register data:', event);
  }
} 
