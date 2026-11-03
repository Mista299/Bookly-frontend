import type { BrowserContextOptions } from '@playwright/test';
import { devices as pwDevices } from '@playwright/test';

/**
 * Registry de dispositivos usados para la matriz responsive/móvil.
 * Los tamaños reales de Android/iOS dominantes cubren el requisito
 * "que se vea bien en cualquier celular".
 *
 * `label` es informativo (para los títulos de los tests) y no forma parte de
 * BrowserContextOptions, por eso el tipo propio.
 */
type DeviceSpec = BrowserContextOptions & { label: string };

export type { DeviceSpec };

export const DEVICES = {
  /** iPhone SE 1 — el límite inferior real (320px). Nadie debe designing más abajo. */
  'iphone-se': {
    label: 'iPhone SE (320px)',
    viewport: { width: 320, height: 568 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: pwDevices['iPhone SE'].userAgent
  },
  /** Galaxy S8 / A series — Android más vendido en gama media. */
  'galaxy-s8': {
    label: 'Galaxy S8 (360px)',
    viewport: { width: 360, height: 740 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: pwDevices['Galaxy S5'].userAgent
  },
  /** Pixel 7 — Android moderno flagship. */
  'pixel-7': {
    label: 'Pixel 7 (412px)',
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
  },
  /** iPhone 14 Pro — notch + Dynamic Island, safe-area crítico. */
  'iphone-14': {
    label: 'iPhone 14 Pro (393px)',
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: pwDevices['iPhone 13'].userAgent
  },
  /** Tablet portrait — verifica que no se rompe el layout en pantallas grandes táctiles. */
  tablet: {
    label: 'Tablet 768px',
    viewport: { width: 768, height: 1024 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: pwDevices['iPad Mini'].userAgent
  },
  desktop: {
    label: 'Desktop 1440px',
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false
  }
} as const satisfies Record<string, DeviceSpec>;

export type DeviceKey = keyof typeof DEVICES;
export const DEVICE_KEYS = Object.keys(DEVICES) as DeviceKey[];

/** Solo los dispositivos móviles/táctiles (excluye desktop). */
export const MOBILE_DEVICE_KEYS = DEVICE_KEYS.filter((k) => k !== 'desktop');

/** Aplica un dispositivo al contexto de Playwright. */
export function applyDevice(
  contextOptions: BrowserContextOptions,
  key: DeviceKey
): BrowserContextOptions {
  const d = DEVICES[key] as DeviceSpec;
  return {
    ...contextOptions,
    viewport: d.viewport,
    deviceScaleFactor: d.deviceScaleFactor,
    isMobile: d.isMobile,
    hasTouch: d.hasTouch,
    userAgent: d.userAgent
  };
}
