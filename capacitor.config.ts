import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hany.alrawi',
  appName: 'Al-Rawi',
  webDir: 'out',
  plugins: {
    // Native networking prevents WebView CORS from blocking the existing secure RSS proxy.
    CapacitorHttp: { enabled: true }
  }
};

export default config;
