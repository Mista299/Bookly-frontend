<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    eyebrow?: string;
    title: string;
    description?: string;
    actions?: Snippet;
  }

  let { eyebrow, title, description, actions }: Props = $props();
</script>

<header class="page-head" data-od-id="page-head">
  <div class="page-head__main">
    {#if eyebrow}<p class="page-head__eyebrow">{eyebrow}</p>{/if}
    <h1 class="page-head__title">{title}</h1>
    {#if description}<p class="page-head__desc">{description}</p>{/if}
  </div>
  {#if actions}
    <div class="page-head__actions">{@render actions()}</div>
  {/if}
</header>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .page-head {
    display: flex;
    flex-direction: column;
    gap: $space-4;
    margin-bottom: $space-8;
  }

  @media (min-width: #{$bp-md}) {
    .page-head {
      flex-direction: row;
      align-items: flex-end;
      justify-content: space-between;
      gap: $space-6;
    }
  }

  .page-head__eyebrow {
    font-size: $fs-xs;
    font-weight: $fw-medium;
    letter-spacing: $ls-wide;
    text-transform: uppercase;
    color: $muted;
    margin-bottom: $space-3;
  }

  .page-head__title {
    font-family: $font-display;
    font-size: clamp(28px, 4vw, 36px);
    font-weight: $fw-semibold;
    letter-spacing: $ls-display;
    line-height: $lh-tight;
    color: $text;
    margin: 0;
  }

  .page-head__desc {
    margin-top: $space-3;
    font-size: $fs-md;
    color: $muted;
    line-height: $lh-relaxed;
    max-width: 60ch;
  }

  .page-head__actions {
    display: flex;
    gap: $space-3;
    flex-wrap: wrap;
  }
</style>