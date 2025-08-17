import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
  animateChild,
  group,
  keyframes,
  state,
} from '@angular/animations';

/**
 * Animación de desvanecimiento para entrada/salida de elementos
 */
export const fadeAnimation = trigger('fadeAnimation', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('300ms', style({ opacity: 1 })),
  ]),
  transition(':leave', [
    animate('300ms', style({ opacity: 0 })),
  ]),
]);

/**
 * Animación para listas con efecto de cascada
 */
export const listAnimation = trigger('listAnimation', [
  transition('* <=> *', [
    query(':enter',
      [style({ opacity: 0, transform: 'translateY(-15px)' }),
      stagger('50ms',
        animate('300ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })))
      ],
      { optional: true }
    ),
    query(':leave',
      animate('200ms ease-in',
        style({ opacity: 0, transform: 'translateY(-15px)' })),
      { optional: true }
    )
  ])
]);

/**
 * Animación de escala para elementos individuales
 */
export const scaleAnimation = trigger('scaleAnimation', [
  transition(':enter', [
    style({ transform: 'scale(0.9)', opacity: 0 }),
    animate('150ms ease-out', style({ transform: 'scale(1)', opacity: 1 })),
  ]),
  transition(':leave', [
    animate('150ms ease-in', style({ transform: 'scale(0.9)', opacity: 0 })),
  ]),
]);

/**
 * Animación de deslizamiento para paneles
 */
export const slideAnimation = trigger('slideAnimation', [
  transition(':enter', [
    style({ transform: 'translateY(-10px)', opacity: 0 }),
    animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 })),
  ]),
  transition(':leave', [
    animate('300ms ease-in', style({ transform: 'translateY(-10px)', opacity: 0 })),
  ]),
]);

/**
 * Animación de rotación para iconos y elementos que giran
 */
export const rotateAnimation = trigger('rotateAnimation', [
  transition('* => *', [
    animate('300ms ease-out', keyframes([
      style({ transform: 'rotate(0deg)', offset: 0 }),
      style({ transform: 'rotate(180deg)', offset: 0.5 }),
      style({ transform: 'rotate(360deg)', offset: 1 })
    ]))
  ])
]);

/**
 * Animación de expansión para paneles colapsables
 */
export const expandAnimation = trigger('expandAnimation', [
  transition(':enter', [
    style({ height: '0', opacity: 0 }),
    animate('300ms ease-out', style({ height: '*', opacity: 1 }))
  ]),
  transition(':leave', [
    style({ height: '*', opacity: 1 }),
    animate('300ms ease-in', style({ height: '0', opacity: 0 }))
  ])
]);

/**
 * Animación de rebote para elementos interactivos
 */
export const bounceAnimation = trigger('bounceAnimation', [
  transition('* => *', [
    animate('500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', keyframes([
      style({ transform: 'scale(1)', offset: 0 }),
      style({ transform: 'scale(1.1)', offset: 0.3 }),
      style({ transform: 'scale(0.9)', offset: 0.6 }),
      style({ transform: 'scale(1)', offset: 1 })
    ]))
  ])
]);

/**
 * Animación de ondulación para efectos de clic
 */
export const rippleAnimation = trigger('rippleAnimation', [
  transition('* => *', [
    animate('1000ms ease-out', keyframes([
      style({ transform: 'scale(0)', opacity: 0.5, offset: 0 }),
      style({ transform: 'scale(2)', opacity: 0, offset: 1 })
    ]))
  ])
]);

/**
 * Animación de sacudida para alertas y errores
 */
export const shakeAnimation = trigger('shakeAnimation', [
  transition('* => *', [
    animate('500ms ease-in-out', keyframes([
      style({ transform: 'translateX(0)', offset: 0 }),
      style({ transform: 'translateX(-10px)', offset: 0.2 }),
      style({ transform: 'translateX(10px)', offset: 0.4 }),
      style({ transform: 'translateX(-10px)', offset: 0.6 }),
      style({ transform: 'translateX(10px)', offset: 0.8 }),
      style({ transform: 'translateX(0)', offset: 1 })
    ]))
  ])
]);

/**
 * Animación para tarjetas
 */
export const cardAnimation = trigger('cardAnimation', [
  transition(':enter', [
    style({ transform: 'translateY(20px)', opacity: 0 }),
    animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
  ]),
  transition(':leave', [
    animate('300ms ease-in', style({ transform: 'translateY(20px)', opacity: 0 }))
  ])
]);
