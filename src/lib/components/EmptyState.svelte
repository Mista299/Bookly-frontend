<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    description?: string;
    icon?: Snippet;
    children?: Snippet;
    action?: Snippet;
    /**
     * Nivel del encabezado del título. Un h3 seguido de un h1 rompe la
     * jerarquía de encabezados (WCAG 1.3.1 / 2.4.6): por defecto se usa h2,
     * que es el nivel natural justo debajo del h1 de la página.
     */
    level?: 2 | 3 | 4;
  }

  let { title, description, icon, children, action, level = 2 }: Props = $props();
</script>

<div class="empty">
  {#if icon}
    <div class="empty__icon" aria-hidden="true">{@render icon()}</div>
  {/if}
  {#if title}
    {#if level === 3}
      <h3 class="empty__title">{title}</h3>
    {:else if level === 4}
      <h4 class="empty__title">{title}</h4>
    {:else}
      <h2 class="empty__title">{title}</h2>
    {/if}
  {/if}
  {#if description}<p class="empty__desc">{description}</p>{/if}
  {#if children}<div class="empty__body">{@render children()}</div>{/if}
  {#if action}<div class="empty__action">{@render action()}</div>{/if}
</div>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: $space-9 $space-6;
    gap: $space-3;
    max-width: 480px;
    margin: 0 auto;
  }

  .empty__icon {
    width: 56px;
    height: 56px;
    border-radius: $radius-pill;
    background: $plum-soft;
    color: $plum;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .empty__title {
    font-size: $fs-xl;
    font-family: $font-display;
    font-weight: $fw-semibold;
    color: $text;
  }

  .empty__desc {
    font-size: $fs-base;
    color: $muted;
    line-height: $lh-relaxed;
  }

  .empty__action {
    margin-top: $space-3;
  }
</style>