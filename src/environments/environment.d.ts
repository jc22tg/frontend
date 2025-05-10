declare module '@environments/environment' {
  export const environment: {
    production: boolean;
    apiUrl: string;
    useMocks?: boolean;
    mockDelay?: number;
    auth: {
      tokenExpiration: number;
      refreshTokenExpiration: number;
      sessionTimeout: number;
    };
  };
} 