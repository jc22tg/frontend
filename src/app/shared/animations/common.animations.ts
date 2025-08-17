import { trigger, transition, style, animate, query, stagger, state } from '@angular/animations';

/**
 * Animación de aparición con desvanecimiento
 */
export const fadeAnimation = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('300ms ease-out', style({ opacity: 1 }))
  ]),
  transition(':leave', [
    animate('300ms ease-in', style({ opacity: 0 }))
  ])
]);

/**
 * Animación de escala
 */
export const scaleAnimation = trigger('scale', [
  transition(':enter', [
    style({ transform: 'scale(0.95)', opacity: 0 }),
    animate('200ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ transform: 'scale(0.95)', opacity: 0 }))
  ])
]);

/**
 * Animación de deslizamiento hacia la derecha
 */
export const slideInRightAnimation = trigger('slideInRight', [
  transition(':enter', [
    style({ transform: 'translateX(100%)' }),
    animate('200ms ease-out', style({ transform: 'translateX(0)' }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ transform: 'translateX(100%)' }))
  ])
]);

/**
 * Animación de deslizamiento hacia la izquierda
 */
export const slideInLeftAnimation = trigger('slideInLeft', [
  transition(':enter', [
    style({ transform: 'translateX(-100%)' }),
    animate('200ms ease-out', style({ transform: 'translateX(0)' }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ transform: 'translateX(-100%)' }))
  ])
]);

/**
 * Animación de deslizamiento hacia arriba
 */
export const slideInUpAnimation = trigger('slideInUp', [
  transition(':enter', [
    style({ transform: 'translateY(30px)', opacity: 0 }),
    animate('200ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ transform: 'translateY(30px)', opacity: 0 }))
  ])
]);

/**
 * Animación de lista con elementos escalonados 
 */
export const listAnimation = trigger('listAnimation', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(10px)' }),
      stagger(80, [
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ], { optional: true })
  ])
]);

/**
 * Animación de notificación emergente
 */
export const notificationAnimation = trigger('notification', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-20px)' }),
    animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
  ]),
  transition(':leave', [
    animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
  ])
]);

/**
 * Animación de tarjeta expandible
 */
export const expandCardAnimation = trigger('expandCard', [
  state('collapsed', style({
    height: '60px',
    overflow: 'hidden'
  })),
  state('expanded', style({
    height: '*',
    overflow: 'hidden'
  })),
  transition('collapsed <=> expanded', [
    animate('200ms cubic-bezier(0.4, 0.0, 0.2, 1)')
  ])
]);

/**
 * Animación de rotación para íconos
 */
export const rotateAnimation = trigger('rotate', [
  state('default', style({ transform: 'rotate(0)' })),
  state('rotated', style({ transform: 'rotate(180deg)' })),
  transition('default <=> rotated', [
    animate('200ms ease-out')
  ])
]);

/**
 * Conjunto de animaciones para páginas completas
 */
export const pageAnimations = {
  pageEnter: trigger('pageEnter', [
    transition(':enter', [
      query('.page-element', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        stagger(60, [
          animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
        ])
      ], { optional: true })
    ])
  ]),
  pageLeave: trigger('pageLeave', [
    transition(':leave', [
      style({ opacity: 1 }),
      animate('300ms ease-in', style({ opacity: 0 }))
    ])
  ])
}; 
