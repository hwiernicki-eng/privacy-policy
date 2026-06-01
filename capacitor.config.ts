import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.flotteatlas.carnet',
  appName: 'Carnet Entretien',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#0d0d0f',
  },
}

export default config
