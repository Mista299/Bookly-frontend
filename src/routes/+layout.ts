/**
 * La app es 100% cliente (SPA).
 *
 * En Capacitor el WebView sirve los assets desde el filesystem local: no hay
 * servidor Node que ejecute el SSR ni las rutas de API del servidor. Con
 * `ssr = false` el HTML se sirve siempre vacío y todo el render ocurre en el
 * cliente, que es exactamente lo que necesita el APK.
 */
export const ssr = false;
export const prerender = false;
