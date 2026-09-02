import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.drive2.app',
  appName: 'Drive2',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: [
      '*.google.com',
      '*.accounts.google.com',
      '*.id.ai',
      'id.ai',
      '*.identity.ic0.app',
      '*.ic0.app'
    ]
  }
};

export default config;
