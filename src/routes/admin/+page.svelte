<script lang="ts">
  import PageHead from '$lib/components/PageHead.svelte';
  import Button from '$lib/components/Button.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import { serviceService } from '$lib/services/service';
  import { toasts } from '$lib/stores/toasts';
  import { onMount } from 'svelte';
  import type { Service } from '$lib/types/service';
  import StatusPill from '$lib/components/StatusPill.svelte';
  import Money from '$lib/components/Money.svelte';
  import { Scissors, Plus, ArrowRight } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  let loading = $state(true);
  let services = $state<Service[]>([]);

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

  const totalActive = $derived(services.filter((s) => s.status === 'ACTIVO').length);
  const totalInactive = $derived(services.filter((s) => s.status === 'INACTIVO').length);
  const recent = $derived(services.slice(0, 4));
</script>

<svelte:head>
  <title>Resumen · BOOKLY Administración</title>
</svelte:head>

<PageHead
  eyebrow="Hoy"
  title="Tu espacio de administración."
  description="Una vista breve de lo que ofrece BOOKLY a clientes y profesionales. Edita, activa o desactiva lo que necesites."
>
  {#snippet actions()}
    <Button iconOnly={false} onclick={() => goto('/admin/services/new')}>
      <Plus size={16} /> Nuevo servicio
    </Button>
  {/snippet}
</PageHead>

<section class="overview" data-od-id="overview">
  <article class="overview__block">
    <p class="overview__label">Servicios publicados</p>
    {#if loading}
      <p class="overview__value placeholder">—</p>
    {:else}
      <p class="overview__value">{totalActive}</p>
    {/if}
    <p class="overview__hint">Visibles para clientes y profesionales.</p>
  </article>
  <article class="overview__block">
    <p class="overview__label">En pausa</p>
    {#if loading}
      <p class="overview__value placeholder">—</p>
    {:else}
      <p class="overview__value">{totalInactive}</p>
    {/if}
    <p class="overview__hint">No aparecen en el catálogo público.</p>
  </article>
  <article class="overview__block overview__block--wide">
    <p class="overview__label">Últimos servicios</p>
    {#if loading}
      <p class="overview__hint">Cargando servicios recientes.</p>
    {:else if recent.length === 0}
      <p class="overview__hint">Aún no hay servicios creados.</p>
    {:else}
      <ul class="recent">
        {#each recent as s (s.id)}
          <li class="recent__item">
            <span class="recent__name">{s.name}</span>
            <span class="recent__meta">
              <Money value={s.price} />
              <span class="recent__sep" aria-hidden="true">·</span>
              <span class="muted">{s.durationMinutes} min</span>
            </span>
            <StatusPill status={s.status} />
          </li>
        {/each}
      </ul>
    {/if}
    <a class="overview__link" href="/admin/services">
      Ver todos los servicios
      <ArrowRight size={14} />
    </a>
  </article>
</section>

<section class="quick">
  <p class="eyebrow">Atajos</p>
  <div class="quick__grid">
    <a class="quick__card" href="/admin/services/new">
      <span class="quick__icon" aria-hidden="true"><Scissors size={18} /></span>
      <div>
        <p class="quick__title">Crear un servicio</p>
        <p class="quick__desc">Define duración, precio y disponibilidad.</p>
      </div>
    </a>
    <a class="quick__card" href="/admin/professionals">
      <span class="quick__icon" aria-hidden="true"><Plus size={18} /></span>
      <div>
        <p class="quick__title">Añadir profesional</p>
        <p class="quick__desc">Da de alta a un nuevo miembro del equipo.</p>
      </div>
    </a>
  </div>
</section>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .overview {
    display: grid;
    gap: $space-6;
    grid-template-columns: 1fr;
    padding-bottom: $space-9;
    border-bottom: 1px solid $border;

    @media (min-width: #{$bp-md}) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (min-width: #{$bp-lg}) {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .overview__block {
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }

  .overview__block--wide {
    @media (min-width: #{$bp-lg}) {
      grid-column: span 1;
    }
  }

  .overview__label {
    font-size: $fs-xs;
    letter-spacing: $ls-wide;
    text-transform: uppercase;
    color: $muted;
    font-weight: $fw-medium;
  }

  .overview__value {
    font-family: $font-display;
    font-size: 56px;
    font-weight: $fw-semibold;
    letter-spacing: $ls-display;
    line-height: 1;
    color: $plum;
  }

  .overview__value.placeholder {
    color: $border;
  }

  .overview__hint {
    font-size: $fs-sm;
    color: $muted;
  }

  .overview__link {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    margin-top: $space-2;
    color: $plum;
    font-size: $fs-sm;
    font-weight: $fw-medium;
    transition: gap var(--dur-fast) var(--ease-out);

    &:hover {
      gap: $space-3;
    }
  }

  .recent {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
  }

  .recent__item {
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: center;
    gap: $space-3;
    padding: $space-3 0;
    border-top: 1px solid $border;

    &:last-child {
      border-bottom: 1px solid $border;
    }
  }

  .recent__name {
    font-weight: $fw-medium;
    color: $text;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .recent__meta {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    font-size: $fs-sm;
    color: $muted;
  }

  .recent__sep {
    color: $border;
  }

  .quick {
    padding-top: $space-8;
  }

  .quick__grid {
    display: grid;
    gap: $space-4;
    grid-template-columns: 1fr;
    margin-top: $space-4;

    @media (min-width: #{$bp-md}) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .quick__card {
    display: flex;
    align-items: center;
    gap: $space-4;
    padding: $space-5;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-md;
    transition:
      border-color var(--dur-fast) var(--ease-out),
      transform var(--dur-fast) var(--ease-out);

    &:hover {
      border-color: color.adjust($border, $lightness: -10%);
      transform: translateY(-1px);
    }
  }

  .quick__icon {
    width: 40px;
    height: 40px;
    border-radius: $radius-sm;
    background: $plum-soft;
    color: $plum;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .quick__title {
    font-weight: $fw-semibold;
    color: $text;
  }

  .quick__desc {
    font-size: $fs-sm;
    color: $muted;
    margin-top: 2px;
  }
</style>