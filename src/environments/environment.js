"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.environment = void 0;
exports.environment = {
    production: false,
    apiUrl: 'http://localhost:3000/api',
    useMocks: true, // Habilitar para usar datos mock cuando el API no esté disponible
    mockDelay: 500, // Retraso para simular latencia de red (en ms)
    auth: {
        tokenExpiration: 3600, // 1 hora en segundos
        refreshTokenExpiration: 604800, // 7 días en segundos
        sessionTimeout: 1800, // 30 minutos en segundos
    },
};
