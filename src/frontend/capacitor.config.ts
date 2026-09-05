import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.drive2.app',
  appName: 'Drive2',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'SUA_URL_AQUI',
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: [
      '*.google.com',
      '*.accounts.google.com',
      '*.id.ai',
      'id.ai',
      '*.identity.ic0.app',
      '*.ic0.app',
      '*.caffeine.ai',
      '*.icp0.io'
    ]
  }
};

export default config;
