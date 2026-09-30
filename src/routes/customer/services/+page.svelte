<script lang="ts">
  import PageHead from '$lib/components/PageHead.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import Money from '$lib/components/Money.svelte';
  import { serviceService } from '$lib/services/service';
  import { toasts } from '$lib/stores/toasts';
  import { onMount } from 'svelte';
  import type { Service } from '$lib/types/service';
  import { Search, Scissors, ChevronRight } from 'lucide-svelte';

  let services = $state<Service[]>([]);
  let loading = $state(true);
  let query = $state('');
  let category = $state<string>('Todas');

  const categories = $derived(['Todas', ...new Set(services.map((s) => s.category))]);

  const filtered = $derived(
    services
      .filter((s) => s.status === 'ACTIVO')
      .filter((s) => {
        const q = query.trim().toLowerCase();
        const matchQuery =
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q);
        const matchCategory = category === 'Todas' || s.category === category;
        return matchQuery && matchCategory;
      })
  );

  onMount(async () => {
    try {
      services = await serviceService.list();
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'No se pudieron cargar los servicios.';
      toasts.push(msg, 'danger');
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Servicios · BOOKLY</title>
</svelte:head>

<div class="page">
  <PageHead
    eyebrow="Explorar"
    title="Servicios."
    description="Encuentra lo que necesitas y reserva cuando te quede mejor."
  />

  <div class="filters">
    <label class="search">
      <Search size={16} />
      <input type="search" placeholder="Buscar servicios…" bind:value={query} />
    </label>
    <div class="chips" role="tablist">
      {#each categories as c (c)}
        <button
          type="button"
          class="chip"
          class:is-active={category === c}
          onclick={() => (category = c)}
        >
          {c}
        </button>
      {/each}
    </div>
  </div>

  {#if loading}
    <div class="list">
      {#each Array(4) as _, i (i)}
        <Skeleton lines={2} avatar />
      {/each}
    </div>
  {:else if filtered.length === 0}
    <EmptyState
      title="Sin coincidencias"
      description={services.length === 0
        ? 'Aún no hay servicios disponibles.'
        : 'Prueba con otra búsqueda o cambia la categoría.'}
    />
  {:else}
    <ul class="list" data-od-id="customer-services-list">
      {#each filtered as s (s.id)}
        <li class="row">
          <a class="row__link" href="/customer/services/{s.id}" data-od-id={`customer-service-${s.id}`}>
            <span class="row__icon" aria-hidden="true"><Scissors size={16} /></span>
            <div class="row__main">
              <p class="row__name">{s.name}</p>
              <p class="row__meta">{s.category} · {s.durationMinutes} min</p>
              <p class="row__desc">{s.description}</p>
            </div>
            <div class="row__end">
              <span class="row__price"><Money value={s.price} /></span>
              <span class="row__chev" aria-hidden="true"><ChevronRight size={18} /></span>
            </div>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .page {
    padding: $space-7 $space-5 $space-9;
    max-width: 880px;
    margin: 0 auto;

    @media (min-width: #{$bp-md}) {
      padding: $space-9 $space-7;
    }
  }

  .filters {
    display: flex;
    flex-direction: column;
    gap: $space-3;
    margin-bottom: $space-6;
  }

  .search {
    display: flex;
    align-items: center;
    gap: $space-3;
    padding: 0 $space-4;
    min-height: var(--touch-target);
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-md;
    color: $muted;
    transition: border-color var(--dur-fast) var(--ease-out);

    input {
      flex: 1;
      border: 0;
      background: transparent;
      font-size: $fs-base;
      color: $text;

      &:focus {
        outline: none;
      }
    }

    &:focus-within {
      border-color: $plum;
      box-shadow: 0 0 0 3px rgba(56, 44, 70, 0.12);
    }
  }

  .chips {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 2px;
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar { display: none; }
  }

  .chip {
    border: 1px solid $border;
    background: $surface;
    color: $muted;
    padding: 8px 14px;
    border-radius: $radius-pill;
    font-size: $fs-sm;
    font-weight: $fw-medium;
    cursor: pointer;
    flex-shrink: 0;
    transition:
      background var(--dur-fast) var(--ease-out),
      color var(--dur-fast) var(--ease-out),
      border-color var(--dur-fast) var(--ease-out);

    &:hover {
      color: $text;
    }

    &.is-active {
      background: $plum;
      color: $surface;
      border-color: $plum;
    }
  }

  .list {
    display: flex;
    flex-direction: column;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    overflow: hidden;
  }

  .row {
    border-top: 1px solid $border;

    &:first-child {
      border-top: 0;
    }
  }

  .row__link {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: $space-4;
    align-items: flex-start;
    padding: $space-5;
    transition: background var(--dur-fast) var(--ease-out);

    &:hover {
      background: rgba(248, 246, 242, 0.6);
    }
  }

  .row__icon {
    width: 36px;
    height: 36px;
    border-radius: $radius-sm;
    background: $plum-soft;
    color: $plum;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .row__main {
    min-width: 0;
  }

  .row__name {
    font-family: $font-display;
    font-weight: $fw-semibold;
    font-size: $fs-md;
    color: $text;
    letter-spacing: $ls-tight;
  }

  .row__meta {
    font-size: $fs-xs;
    color: $muted;
    margin: 2px 0 $space-2;
  }

  .row__desc {
    font-size: $fs-sm;
    color: $muted;
    line-height: $lh-relaxed;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .row__end {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: $space-2;
  }

  .row__price {
    font-weight: $fw-semibold;
    color: $text;
    font-variant-numeric: tabular-nums;
  }

  .row__chev {
    color: $muted;
  }
</style>