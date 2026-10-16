<script lang="ts">
  import { Copy, Check } from 'lucide-svelte';

  interface Props {
    items: string[];
    title?: string;
    description?: string;
  }

  let { items, title = 'Códigos de recuperación', description = 'Guarda estos códigos en un lugar seguro. Cada uno se puede usar una sola vez si pierdes acceso a tu segundo factor.' }: Props = $props();

  let copied = $state<string | null>(null);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(items.join('\n'));
      copied = 'all';
      setTimeout(() => (copied = null), 1500);
    } catch {
      copied = null;
    }
  }

  async function copyOne(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      copied = code;
      setTimeout(() => (copied = null), 1500);
    } catch {
      copied = null;
    }
  }
</script>

<section class="codes">
  <header class="codes__head">
    <div>
      <h3 class="codes__title">{title}</h3>
      {#if description}<p class="codes__desc">{description}</p>{/if}
    </div>
    <button type="button" class="codes__copy" onclick={copyAll}>
      {#if copied === 'all'}
        <Check size={14} /> Copiados
      {:else}
        <Copy size={14} /> Copiar todos
      {/if}
    </button>
  </header>
  <ul class="codes__grid">
    {#each items as code, i (i + ':' + code)}
      <li class="codes__item">
        <code class="codes__code">{code}</code>
        <button type="button" class="codes__one" aria-label="Copiar" onclick={() => copyOne(code)}>
          {#if copied === code}<Check size={12} />{:else}<Copy size={12} />{/if}
        </button>
      </li>
    {/each}
  </ul>
</section>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .codes {
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    padding: $space-5 $space-6;
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  .codes__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: $space-4;
    flex-wrap: wrap;
  }

  .codes__title {
    font-family: $font-display;
    font-size: $fs-lg;
    font-weight: $fw-semibold;
    color: $text;
  }

  .codes__desc {
    font-size: $fs-sm;
    color: $muted;
    line-height: $lh-relaxed;
    margin-top: 2px;
    max-width: 56ch;
  }

  .codes__copy {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: $radius-pill;
    border: 1px solid $border;
    background: $surface;
    color: $text;
    font-size: $fs-sm;
    font-weight: $fw-medium;
    transition:
      background var(--dur-fast) var(--ease-out),
      color var(--dur-fast) var(--ease-out);

    &:hover {
      background: $plum-soft;
      color: $plum;
      border-color: $plum-soft;
    }
  }

  .codes__grid {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: $space-2;
    grid-template-columns: 1fr 1fr;

    @media (min-width: #{$bp-md}) {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .codes__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-2;
    padding: $space-3 $space-4;
    background: $ivory;
    border: 1px solid $border;
    border-radius: $radius-md;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }

  .codes__code {
    font-size: $fs-sm;
    color: $text;
    letter-spacing: 0.04em;
  }

  .codes__one {
    background: transparent;
    border: 0;
    color: $muted;
    cursor: pointer;
    border-radius: $radius-sm;
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: color var(--dur-fast) var(--ease-out);

    &:hover {
      color: $plum;
    }
  }
</style>
