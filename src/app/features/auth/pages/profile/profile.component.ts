import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule]
})
export class ProfileComponent {
  user = {
    name: 'Usuario Ejemplo',
    email: 'usuario@ejemplo.com',
    role: 'ADMIN'
  };

  onLogout() {
    // Implementar lógica de cierre de sesión
    console.log('Logout');
  }
} 