import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kepha.app',
  appName: 'Kepha',
  webDir: 'out',
  server: {
    url: 'https://kepha-dun.vercel.app/', // 👈 replace with your real URL
    cleartext: false,
  },
};

export default config;