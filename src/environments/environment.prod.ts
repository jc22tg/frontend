export const environment = {
  production: true,
  apiUrl: 'https://api.tu-dominio.com/api',
  useMocks: false, // Deshabilitar mocks en producción
  mockDelay: 0, // Sin retraso en producción
  auth: {
    tokenExpiration: 3600, // 1 hora en segundos
    refreshTokenExpiration: 604800, // 7 días en segundos
    sessionTimeout: 1800 // 30 minutos en segundos
  }
}; 