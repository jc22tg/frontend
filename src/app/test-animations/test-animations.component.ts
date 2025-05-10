import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  trigger, 
  transition, 
  style, 
  animate 
} from '@angular/animations';

@Component({
  selector: 'app-test-animations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './test-animations.component.html',
  styleUrls: ['./test-animations.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class TestAnimationsComponent {

}
