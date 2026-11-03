<script lang="ts">
  import { untrack } from 'svelte';
  import { page } from '$app/stores';
  import { MoreHorizontal, X } from 'lucide-svelte';

  export interface NavItem {
    href: string;
    label: string;
    icon: typeof MoreHorizontal;
    exact?: boolean;
  }

  interface Props {
    items: NavItem[];
    /** Etiqueta del disparador del panel extra. */
    moreLabel?: string;
    /** aria-label de la navegación. */
    label?: string;
  }

  let { items, moreLabel = 'Más', label = 'Secciones' }: Props = $props();

  /**
   * En móvil la barra inferior muestra como máximo 5 destinos (el límite de
   * las plataformas para que los dedos acierten). El resto se agrupa bajo
   * "Más", que abre un panel con la lista completa.
   */
  const MAX_VISIBLE = 5;

  let sheetOpen = $state(false);

  const visible = $derived(items.slice(0, MAX_VISIBLE - 1));
  const overflow = $derived(items.slice(MAX_VISIBLE - 1));

  function isActive(href: string, exact?: boolean): boolean {
    const path = $page.url.pathname;
    if (exact) return path === href;
    return path === href || path.startsWith(href + '/');
  }

  /** ¿Hay algún destino del grupo extra activo? Entonces "Más" queda activo. */
  const overflowActive = $derived(overflow.some((i) => isActive(i.href, i.exact)));

  /**
   * Cierra el panel al navegar. Se usa `untrack` para que el efecto NO
   * dependa de `sheetOpen`: si lo leyera, al abrir el panel el efecto se
   * volvería a ejecutar y lo cerraría al instante.
   */
  $effect(() => {
    const path = $page.url.pathname;
    if (path) {
      untrack(() => {
        sheetOpen = false;
      });
    }
  });

  // Al abrir el panel, el foco entra en él para que se pueda navegar con el
  // teclado (y cerrar con Escape).
  let sheetEl = $state<HTMLElement | null>(null);
  $effect(() => {
    if (sheetOpen && sheetEl) {
      sheetEl.focus();
    }
  });
</script>

<!-- Barra inferior (móvil). En escritorio se oculta: el layout usa el lateral. -->
<nav class="bnav" aria-label={label}>
  {#each visible as item (item.href)}
    {@const active = isActive(item.href, item.exact)}
    <a
      href={item.href}
      class="bnav__item"
      class:is-active={active}
      aria-current={active ? 'page' : undefined}
      data-od-id={`nav-link-${item.href.replace(/\//g, '-')}`}
    >
      <span class="bnav__icon" aria-hidden="true">
        <item.icon size={20} />
      </span>
      <span class="bnav__label">{item.label}</span>
    </a>
  {/each}

  {#if overflow.length > 0}
    <button
      type="button"
      class="bnav__item bnav__item--more"
      class:is-active={overflowActive}
      aria-expanded={sheetOpen}
      aria-haspopup="dialog"
      onclick={() => (sheetOpen = true)}
      data-od-id="nav-more"
    >
      <span class="bnav__icon" aria-hidden="true">
        <MoreHorizontal size={20} />
      </span>
      <span class="bnav__label">{moreLabel}</span>
    </button>
  {/if}
</nav>

{#if sheetOpen}
  <!-- Panel con el resto de secciones. -->
  <!--
    svelte-ignore a11y_no_noninteractive_element_interactions
    svelte-ignore a11y_click_events_have_key_events
  -->
  <div
    class="sheet"
    role="dialog"
    aria-modal="true"
    aria-label="Más secciones"
    tabindex="-1"
    bind:this={sheetEl}
    onclick={(e) => {
      if (e.target === e.currentTarget) sheetOpen = false;
    }}
    onkeydown={(e) => {
      // Escape cierra el panel.
      if (e.key === 'Escape') sheetOpen = false;
    }}
  >
    <div class="sheet__panel">
      <div class="sheet__head">
        <p class="sheet__title">Todas las secciones</p>
        <button
          type="button"
          class="sheet__close"
          aria-label="Cerrar"
          onclick={() => (sheetOpen = false)}
        >
          <X size={18} />
        </button>
      </div>
      <ul class="sheet__list">
        {#each overflow as item (item.href)}
          {@const active = isActive(item.href, item.exact)}
          <li>
            <a
              href={item.href}
              class="sheet__item"
              class:is-active={active}
              aria-current={active ? 'page' : undefined}
              data-od-id={`nav-link-${item.href.replace(/\//g, '-')}`}
            >
              <span class="sheet__icon" aria-hidden="true">
                <item.icon size={18} />
              </span>
              <span>{item.label}</span>
            </a>
          </li>
        {/each}
      </ul>
    </div>
  </div>
{/if}

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .bnav {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: $z-sticky;
    display: flex;
    align-items: stretch;
    justify-content: space-around;
    gap: 0;
    background: $surface;
    border-top: 1px solid $border;
    padding: $space-2 calc(#{$space-3} + var(--safe-right))
      calc(#{$space-2} + var(--safe-bottom)) calc(#{$space-3} + var(--safe-left));
  }

  .bnav__item {
    flex: 1 1 0;
    min-width: 0;
    min-height: 56px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: $space-2 $space-1;
    border: 0;
    background: transparent;
    color: $muted;
    font-size: 11px;
    font-weight: $fw-medium;
    text-align: center;
    border-radius: $radius-sm;
    transition: color var(--dur-fast) var(--ease-out);

    &:hover {
      color: $text;
    }

    &.is-active {
      color: $plum;
    }
  }

  .bnav__icon {
    display: inline-flex;
  }

  .bnav__label {
    // Si la etiqueta es muy larga se recorta con elipsis en vez de
    // desbordar la barra y descuadrar los iconos.
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.2;
  }

  // Panel de secciones adicionales.
  .sheet {
    position: fixed;
    inset: 0;
    z-index: $z-modal;
    background: rgba(41, 37, 45, 0.45);
    display: flex;
    align-items: flex-end;
    animation: sheet-fade var(--dur-base) var(--ease-out);
  }

  .sheet__panel {
    width: 100%;
    background: $surface;
    border-radius: $radius-xl $radius-xl 0 0;
    padding: $space-5 $space-5 calc(#{$space-5} + var(--safe-bottom));
    max-height: 80dvh;
    overflow-y: auto;
    animation: sheet-rise var(--dur-base) var(--ease-out);
  }

  .sheet__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $space-4;
  }

  .sheet__title {
    font-family: $font-display;
    font-size: $fs-lg;
    font-weight: $fw-semibold;
    color: $text;
  }

  .sheet__close {
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid $border;
    border-radius: $radius-sm;
    background: transparent;
    color: $muted;

    &:hover {
      color: $text;
      background: $ivory;
    }
  }

  .sheet__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: $space-1;
  }

  .sheet__item {
    display: flex;
    align-items: center;
    gap: $space-3;
    min-height: $touch-target;
    padding: $space-3 $space-3;
    border-radius: $radius-md;
    color: $text;
    font-size: $fs-base;
    font-weight: $fw-medium;

    &:hover {
      background: $ivory;
    }

    &.is-active {
      background: $plum-soft;
      color: $plum;
    }
  }

  .sheet__icon {
    display: inline-flex;
    color: $muted;
  }

  @keyframes sheet-fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes sheet-rise {
    from {
      transform: translateY(12px);
    }
    to {
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .sheet,
    .sheet__panel {
      animation: none;
    }
  }

  // En escritorio la barra inferior no se usa: el layout lateral manda.
  @media (min-width: $bp-lg) {
    .bnav {
      display: none;
    }
  }
</style>
