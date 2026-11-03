<script lang="ts">
  import '$lib/styles/index.scss';
  import Toaster from '$lib/components/Toaster.svelte';
  import { auth } from '$lib/stores/auth';
  import { UNAUTHORIZED_EVENT } from '$lib/services/api';
  import { toasts } from '$lib/stores/toasts';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Capacitor } from '@capacitor/core';
  import { StatusBar, Style } from '@capacitor/status-bar';
  import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
  import { SplashScreen } from '@capacitor/splash-screen';
  import { App } from '@capacitor/app';
  import { Network } from '@capacitor/network';

  let { children } = $props();

  /** Rutas privadas: si la sesión expira, el usuario vuelve al login. */
  function isPrivatePath(path: string): boolean {
    return (
      path.startsWith('/admin') ||
      path.startsWith('/professional') ||
      path.startsWith('/customer')
    );
  }

  onMount(() => {
    auth.bootstrap();

    const onUnauth = () => {
      const path = $page.url?.pathname ?? '';
      if (isPrivatePath(path)) {
        toasts.push('Tu sesión expiró. Inicia sesión de nuevo.', 'warning');
        void goto('/login', { replaceState: true });
      }
    };

    window.addEventListener(UNAUTHORIZED_EVENT, onUnauth);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauth);
  });

  /**
   * Integración con el shell nativo de Capacitor.
   * Solo se ejecuta dentro del APK: en el navegador web no hay StatusBar,
   * Keyboard ni App, y llamarlos lanzaría errores.
   */
  onMount(() => {
    if (!Capacitor.isNativePlatform()) return;

    // 1) Barra de estado: se pinta con la ciruela de marca y los iconos en
    //    claro, porque el fondo es oscuro.
    void StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    void StatusBar.setBackgroundColor({ color: '#382C46' }).catch(() => {});
    void StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});

    // 2) Teclado: al abrir un input, la ventana se redimensiona para que el
    //    campo quede visible por encima del teclado del sistema.
    void Keyboard.setResizeMode({ mode: KeyboardResize.Native }).catch(() => {});
    void Keyboard.setAccessoryBarVisible({ isVisible: false }).catch(() => {});

    // 3) Botón atrás de Android: navegamos hacia atrás en el historial. Si
    //    estamos en la raíz de una sección, salimos de la app (comportamiento
    //    esperado en Android). Sin esto el botón atrás cierra la app sin
    //    avisar y el usuario pierde su sitio.
    let backHandler: { remove: () => Promise<void> } | undefined;
    void App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
        return;
      }
      const path = $page.url?.pathname ?? '';
      const roots = ['/admin', '/professional', '/customer'];
      const isRoot = roots.some((r) => path === r || path === `${r}/`);
      if (isRoot) {
        void App.exitApp();
      } else {
        void goto('/');
      }
    }).then((h) => {
      backHandler = h;
    });

    // 4) Conectividad: avisamos cuando se pierde la red, en vez de dejar al
    //    usuario mirando una pantalla que no carga.
    let wasOnline = true;
    const updateNetwork = (online: boolean) => {
      if (wasOnline && !online) {
        toasts.push('Sin conexión. Revisa tu red para continuar.', 'warning');
      }
      wasOnline = online;
    };
    void Network.getStatus().then((s) => updateNetwork(s.connected)).catch(() => {});
    let networkListener: { remove: () => Promise<void> } | undefined;
    void Network.addListener('networkStatusChange', (s) =>
      updateNetwork(s.connected)
    ).then((h) => {
      networkListener = h;
    });

    // 5) Splash: se oculta cuando la app ya está pintada. Si el primer
    //    hide falla (el WebView todavía no ha pintado), se reintenta.
    const hideSplash = async (intentos = 0) => {
      try {
        await SplashScreen.hide();
      } catch {
        if (intentos < 5) {
          setTimeout(() => void hideSplash(intentos + 1), 250);
        }
      }
    };
    void hideSplash();

    return () => {
      void backHandler?.remove();
      void networkListener?.remove();
    };
  });
</script>

{@render children?.()}
<Toaster />
