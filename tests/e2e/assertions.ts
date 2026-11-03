import { expect, type Page, type Locator } from '@playwright/test';

export const TOUCH_TARGET_MIN = 44; // px, WCAG 2.5.5 / Material 3

/**
 * Detecta scroll horizontal (overflow-x). Es el bug #1 de "no se ve bien en mi celular":
 * algo se sale del viewport y el usuario tiene que scrollear lateralmente.
 */
export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const delta = doc.scrollWidth - doc.clientWidth;
    if (delta <= 1) return null;

    // Identifica los culpables concretos para que el fallo sea accionable.
    const culprits: string[] = [];
    const limit = doc.clientWidth + 1;
    document.querySelectorAll<HTMLElement>('body *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (r.right > limit) {
        const id = el.id ? `#${el.id}` : '';
        const cls = el.className && typeof el.className === 'string'
          ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
          : '';
        culprits.push(`${el.tagName.toLowerCase()}${id}${cls} (right=${Math.round(r.right)})`);
      }
    });
    return { delta, culprits: culprits.slice(0, 6) };
  });

  if (overflow) {
    throw new Error(
      `Scroll horizontal de ${overflow.delta}px.\nCulprits:\n  ${overflow.culprits.join('\n  ')}`
    );
  }
}

/**
 * Verifica que los elementos interactivos tengan un área táctil mínima.
 * Ignora elementos ocultos, disabled o de tamaño cero.
 */
export async function expectTouchTargets(page: Page, min = TOUCH_TARGET_MIN): Promise<void> {
  const small = await page.evaluate((minPx) => {
    const out: string[] = [];
    const sel = 'a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], [role="tab"]';
    document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      if ((el as HTMLButtonElement).disabled) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;

      // Los enlaces de texto en línea dentro de un párrafo no son un
      // objetivo táctil: pulsarlos require apuntar entre palabras.
      const isInlineInText =
        el.tagName === 'A' &&
        !!el.closest('p, li') &&
        getComputedStyle(el).display.startsWith('inline');
      if (isInlineInText) return;

      if (r.height < minPx || r.width < minPx) {
        const label = (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30);
        out.push(
          `${el.tagName.toLowerCase()}[${label}] ${Math.round(r.width)}x${Math.round(r.height)} < ${minPx}px`
        );
      }
    });
    return out.slice(0, 8);
  }, min);

  if (small.length) {
    throw new Error(`Touch targets < ${min}px:\n  ${small.join('\n  ')}`);
  }
}

/** Cada control interactivo debe tener nombre accesible (label, aria-label o texto). */
export async function expectAccessibleNames(page: Page): Promise<void> {
  const unnamed = await page.evaluate(() => {
    const out: string[] = [];
    const sel = 'a[href], button, input:not([type="hidden"]), select, textarea';
    document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      const aria = el.getAttribute('aria-label')?.trim();
      const labelledby = el.getAttribute('aria-labelledby');
      const hasLabel =
        !!aria ||
        (!!labelledby && !!document.getElementById(labelledby)) ||
        !!el.closest('label') ||
        (el.id && !!document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) ||
        !!(el.textContent || '').trim() ||
        el.getAttribute('title')?.trim() !== '';
      if (!hasLabel) {
        out.push(`${el.tagName.toLowerCase()}[${(el as HTMLInputElement).type ?? ''}] id=${el.id || '-'}`);
      }
    });
    return out.slice(0, 10);
  });

  if (unnamed.length) {
    throw new Error(`Controles sin nombre accesible:\n  ${unnamed.join('\n  ')}`);
  }
}

/** Todas las imágenes deben tener alt (decorativas: alt=""). */
export async function expectImageAltText(page: Page): Promise<void> {
  const missing = await page.evaluate(() => {
    const out: string[] = [];
    document.querySelectorAll('img').forEach((img) => {
      if (!img.hasAttribute('alt')) out.push(img.src.slice(-50));
    });
    return out.slice(0, 10);
  });
  if (missing.length) throw new Error(`<img> sin alt:\n  ${missing.join('\n  ')}`);
}

/** Los headings no deben saltarse niveles (h1 -> h3). */
export async function expectHeadingOrder(page: Page): Promise<void> {
  const jumps = await page.evaluate(() => {
    const out: string[] = [];
    const levels = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
      .filter((h) => (h.textContent || '').trim().length > 0)
      .map((h) => ({
        level: Number(h.tagName[1]),
        text: (h.textContent || '').trim().slice(0, 40)
      }));
    for (let i = 1; i < levels.length; i++) {
      if (levels[i].level - levels[i - 1].level > 1) {
        out.push(
          `h${levels[i - 1].level} "${levels[i - 1].text}" -> h${levels[i].level} "${levels[i].text}"`
        );
      }
    }
    return out;
  });
  if (jumps.length) throw new Error(`Saltos en jerarquía de headings:\n  ${jumps.join('\n  ')}`);
}

/** Debe existir exactamente un h1 por pantalla. */
export async function expectSingleH1(page: Page): Promise<void> {
  const count = await page.locator('h1').count();
  if (count !== 1) throw new Error(`Se esperaba 1 <h1>, hay ${count}`);
}

/** El foco debe ser visible al tabular (outline !== none y no invisible). */
export async function expectVisibleFocus(page: Page): Promise<void> {
  const results: string[] = [];
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const s = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        outlineWidth: s.outlineWidth,
        outlineStyle: s.outlineStyle,
        boxShadow: s.boxShadow,
        text: (el.textContent || '').trim().slice(0, 25)
      };
    });
    if (!info) continue;
    const hasOutline =
      info.outlineStyle !== 'none' && parseFloat(info.outlineWidth) > 0;
    const hasShadow = info.boxShadow && info.boxShadow !== 'none';
    if (!hasOutline && !hasShadow) {
      results.push(`${info.tag} "${info.text}" sin indicador de foco`);
    }
  }
  if (results.length) {
    throw new Error(`Foco no visible:\n  ${results.join('\n  ')}`);
  }
}

/** Ningún texto debe desbordar su contenedor (texto cortado). */
export async function expectNoClippedText(page: Page): Promise<void> {
  const clipped = await page.evaluate(() => {
    const out: string[] = [];
    document.querySelectorAll<HTMLElement>('h1,h2,h3,p,span,label,td,th,button,a').forEach((el) => {
      if (!el.textContent?.trim()) return;
      const s = getComputedStyle(el);
      if (s.overflow === 'visible' && s.textOverflow !== 'ellipsis') return;
      if (s.overflowY === 'visible') return;
      if (el.scrollWidth > el.clientWidth + 2 && s.textOverflow !== 'ellipsis') {
        out.push(`${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 30)}"`);
      }
    });
    return [...new Set(out)].slice(0, 10);
  });
  if (clipped.length) {
    throw new Error(`Texto recortado:\n  ${clipped.join('\n  ')}`);
  }
}

/** Contraste AA del texto principal contra su fondo. */
export async function expectTextContrast(page: Page, minRatio = 4.5): Promise<void> {
  const failures = await page.evaluate(() => {
    type Rgb = [number, number, number];

    function parse(c: string): { rgb: Rgb; a: number } {
      const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
      if (!m) return { rgb: [0, 0, 0], a: 1 };
      return {
        rgb: [Number(m[1]), Number(m[2]), Number(m[3])],
        a: m[4] === undefined ? 1 : Number(m[4])
      };
    }

    function lum(rgb: Rgb): number {
      const f = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
    }

    function ratio(a: Rgb, b: Rgb): number {
      const l1 = lum(a);
      const l2 = lum(b);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    }

    /** Compone un color con alfa sobre un fondo opaco. */
    function over(fg: Rgb, alpha: number, bg: Rgb): Rgb {
      return [
        fg[0] * alpha + bg[0] * (1 - alpha),
        fg[1] * alpha + bg[1] * (1 - alpha),
        fg[2] * alpha + bg[2] * (1 - alpha)
      ];
    }

    /**
     * Fondo efectivo de un elemento: se sube por el árbol componiendo las
     * capas semitransparentes (rgba) sobre el primer fondo opaco.
     */
    function effectiveBg(el: Element): Rgb {
      const layers: { rgb: Rgb; a: number }[] = [];
      let cur: Element | null = el;
      while (cur) {
        const bg = parse(getComputedStyle(cur).backgroundColor);
        if (bg.a > 0) {
          layers.push(bg);
          if (bg.a === 1) break;
        }
        cur = cur.parentElement;
      }
      // De la capa más externa a la más cercana: se componen en ese orden.
      let result: Rgb = [255, 255, 255];
      for (let i = layers.length - 1; i >= 0; i--) {
        const l = layers[i];
        result = over(l.rgb, l.a, result);
      }
      return result;
    }

    const out: { text: string; ratio: number; fg: string; bg: string }[] = [];
    document.querySelectorAll<HTMLElement>('p,span,label,td,th,a,button,h1,h2,h3,h4,li').forEach((el) => {
      const txt = el.textContent?.trim();
      if (!txt) return;
      // Solo nodos con texto propio (no contenedores que agregan hijos).
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim());
      if (!own) return;
      const s = getComputedStyle(el);
      if (s.visibility === 'hidden' || s.display === 'none') return;
      if (parseFloat(s.opacity) < 0.5) return;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;

      // Los placeholders de carga (skeleton) no son texto: son la "—"
      // que aparece mientras llegan los datos. No se les exige contraste
      // porque no son legibles por diseño, y desaparecen al cargar.
      if (el.classList.contains('skeleton') || el.classList.contains('skeleton__line')) {
        return;
      }
      const isPlaceholderGlyph =
        (el.textContent ?? '').trim() === '—' &&
        el.className.toString().includes('placeholder');
      if (isPlaceholderGlyph) return;

      const fgParsed = parse(s.color);
      const bg = effectiveBg(el);
      // El texto también puede tener alfa: se compone sobre el fondo.
      const fg = fgParsed.a < 1 ? over(fgParsed.rgb, fgParsed.a, bg) : fgParsed.rgb;
      const cr = ratio(fg, bg);
      if (cr < 4.5) {
        out.push({
          text: txt.slice(0, 35),
          ratio: Number(cr.toFixed(2)),
          fg: s.color,
          bg: `rgb(${bg.map((v) => Math.round(v)).join(',')})`
        });
      }
    });
    return out.slice(0, 12);
  });

  const bad = failures.filter((f) => f.ratio < minRatio);
  if (bad.length) {
    const lines = bad.map((f) => `"${f.text}" ratio=${f.ratio} fg=${f.fg} bg=${f.bg}`);
    throw new Error(`Contraste < ${minRatio}:1:\n  ${lines.join('\n  ')}`);
  }
}

/** Ningún texto debe ser ilegiblemente pequeño en móvil. */
export async function expectReadableFontSizes(page: Page, minPx = 11): Promise<void> {
  const tiny = await page.evaluate((min) => {
    const out: string[] = [];
    document.querySelectorAll<HTMLElement>('p,span,label,td,th,a,button,li,h1,h2,h3,h4').forEach((el) => {
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim());
      if (!own) return;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      const size = parseFloat(getComputedStyle(el).fontSize);
      if (size < min) out.push(`${el.tagName.toLowerCase()} ${size}px "${el.textContent?.trim().slice(0, 25)}"`);
    });
    return [...new Set(out)].slice(0, 10);
  }, minPx);
  if (tiny.length) {
    throw new Error(`Texto < ${minPx}px:\n  ${tiny.join('\n  ')}`);
  }
}

/** Los errores de consola JS deben estar vacíos. */
export function expectNoConsoleErrors(errors: string[]): void {
  const relevant = errors.filter(
    (e) =>
      !e.includes('favicon') &&
      !e.includes('Failed to load resource: net::ERR_') &&
      !e.includes('Download the React DevTools')
  );
  if (relevant.length) {
    throw new Error(`Errores de consola:\n  ${relevant.slice(0, 8).join('\n  ')}`);
  }
}

/** Los "skeleton" de carga deben terminar (la app no se queda colgada). */
export async function expectLoadingFinished(page: Page, timeout = 8000): Promise<void> {
  const skeleton = page.locator('.skeleton, [class*="skeleton"]').first();
  if (await skeleton.count()) {
    await expect(skeleton).toBeHidden({ timeout }).catch(() => {
      throw new Error('El skeleton de carga nunca desapareció');
    });
  }
}

/** Un elemento debe ser visible y tener área interactiva real. */
export async function expectTappable(locator: Locator): Promise<void> {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  if (!box || box.width < 8 || box.height < 8) {
    throw new Error(`Elemento no interactivo: ${JSON.stringify(box)}`);
  }
}
