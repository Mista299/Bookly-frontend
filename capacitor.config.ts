import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bookly.app',
  appName: 'BOOKLY',
  webDir: 'build',
  server: {
    // Esquema del servidor local de Capacitor. Con 'https' la app se sirve en
    // https://localhost y cualquier fetch a http://… se bloquea como mixed
    // content (el WebView no permite mixear https→http en XHR/fetch).
    // Con 'http' la app y la API comparten esquema y la llamada funciona.
    androidScheme: 'http',
    cleartext: true,
    // Permite que el WebView cargue recursos de otros orígenes (fuentes).
    allowNavigation: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    // Habilita la inspección del WebView por Chrome DevTools (adb forward
    // tcp:9222). Es lo que permite ver los errores de consola de la app
    // mientras se depura en el dispositivo. En release se puede desactivar.
    webContentsDebuggingEnabled: true,
    backgroundColor: '#f8f6f2'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#f8f6f2',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#382c46',
      overlaysWebView: false
    },
    Keyboard: {
      resize: 'native',
      resizeOnFullScreen: true
    }
  }
};

export default config;
