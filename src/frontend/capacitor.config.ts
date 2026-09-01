import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.drive2.app',
  appName: 'Drive2',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: { androidScheme: 'https' },
};

export default config;
