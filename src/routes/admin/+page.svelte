<script lang="ts">
  import PageHead from '$lib/components/PageHead.svelte';
  import Button from '$lib/components/Button.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import { serviceService } from '$lib/services/service';
  import { professionalService } from '$lib/services/professional';
  import { toasts } from '$lib/stores/toasts';
  import { onMount } from 'svelte';
  import type { Service } from '$lib/types/service';
  import type { Professional } from '$lib/types/professional';
  import StatusPill from '$lib/components/StatusPill.svelte';
  import Money from '$lib/components/Money.svelte';
  import {
    Scissors,
    Plus,
    ArrowRight,
    UserRound,
    Search,
    FileSearch,
    Briefcase,
    Users,
    FileClock
  } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  let loading = $state(true);
  let services = $state<Service[]>([]);
  let professionals = $state<Professional[]>([]);
  let professionalsLoading = $state(true);

  onMount(async () => {
    try {
      services = await serviceService.list();
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'No se pudieron cargar los servicios.';
      toasts.push(msg, 'danger');
    } finally {
      loading = false;
    }

    try {
      professionals = await professionalService.list();
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'No se pudieron cargar los profesionales.';
      toasts.push(msg, 'danger');
    } finally {
      professionalsLoading = false;
    }
  });

  const totalActive = $derived(services.filter((s) => s.status === 'ACTIVO').length);
  const totalInactive = $derived(services.filter((s) => s.status === 'INACTIVO').length);
  const totalProfessionals = $derived(professionals.length);
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

<section class="highlight" data-od-id="admin-highlights" aria-label="Accesos rápidos">
  <a class="highlight__card" href="/admin/users">
    <span class="highlight__icon" aria-hidden="true"><Users size={18} /></span>
    <div class="highlight__main">
      <p class="highlight__title">Usuarios pendientes de revisión</p>
      <p class="highlight__desc">Busca cuentas y asigna roles o especialidades.</p>
    </div>
    <ArrowRight size={16} class="highlight__arrow" />
  </a>
  <a class="highlight__card" href="/admin/audit">
    <span class="highlight__icon" aria-hidden="true"><FileClock size={18} /></span>
    <div class="highlight__main">
      <p class="highlight__title">Auditoría reciente</p>
      <p class="highlight__desc">Consulta los eventos críticos de la plataforma.</p>
    </div>
    <ArrowRight size={16} class="highlight__arrow" />
  </a>
</section>

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

  <article class="overview__block">
    <p class="overview__label">Profesionales activos</p>
    {#if professionalsLoading}
      <p class="overview__value placeholder">—</p>
    {:else}
      <p class="overview__value">{totalProfessionals}</p>
    {/if}
    <p class="overview__hint">Equipo disponible para ofrecer servicios.</p>
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

{#if professionalsLoading}
  <section class="quick-skel">
    <Skeleton lines={1} />
    <div class="quick__grid">
      {#each Array(4) as _, i (i)}
        <Skeleton lines={2} avatar />
      {/each}
    </div>
  </section>
{:else if professionals.length === 0}
  <section class="quick-empty">
    <div class="quick-empty__icon" aria-hidden="true">
      <UserRound size={20} />
    </div>
    <div>
      <p class="quick-empty__title">Aún no hay profesionales registrados.</p>
      <p class="quick-empty__desc">
        Da de alta al primer miembro del equipo desde la sección de profesionales.
      </p>
    </div>
  </section>
{/if}

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
    <a class="quick__card" href="/admin/users">
      <span class="quick__icon" aria-hidden="true"><Search size={18} /></span>
      <div>
        <p class="quick__title">Buscar usuarios</p>
        <p class="quick__desc">Encuentra cuentas y asigna roles.</p>
      </div>
    </a>
    <a class="quick__card" href="/admin/audit">
      <span class="quick__icon" aria-hidden="true"><FileSearch size={18} /></span>
      <div>
        <p class="quick__title">Ver auditoría</p>
        <p class="quick__desc">Historial reciente de eventos del sistema.</p>
      </div>
    </a>
  </div>
</section>

<section class="quick quick--secondary">
  <p class="eyebrow">Tu equipo</p>
  {#if professionalsLoading}
    <Skeleton lines={2} />
  {:else if professionals.length > 0}
    <ul class="pros">
      {#each professionals.slice(0, 6) as p (p.id)}
        <li class="pro">
          <span class="pro__icon" aria-hidden="true"><Briefcase size={14} /></span>
          <div class="pro__main">
            <p class="pro__name">{p.fullName}</p>
            <p class="pro__spec">{p.specialty}</p>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
  <a class="quick__link" href="/admin/professionals">
    Ver todos los profesionales
    <ArrowRight size={14} />
  </a>
</section>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .highlight {
    display: grid;
    gap: $space-4;
    grid-template-columns: 1fr;
    margin-bottom: $space-7;

    @media (min-width: #{$bp-md}) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .highlight__card {
    display: flex;
    align-items: center;
    gap: $space-4;
    padding: $space-5;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-md;
    color: $text;
    transition:
      border-color var(--dur-fast) var(--ease-out),
      transform var(--dur-fast) var(--ease-out);

    &:hover {
      border-color: color.adjust($border, $lightness: -10%);
      transform: translateY(-1px);
    }

    &:focus-visible {
      outline: none;
      border-color: $plum;
      box-shadow: 0 0 0 3px rgba(56, 44, 70, 0.12);
    }
  }

  .highlight__icon {
    width: 40px;
    height: 40px;
    border-radius: $radius-sm;
    background: $plum-soft;
    color: $plum;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .highlight__main {
    flex: 1;
    min-width: 0;
  }

  .highlight__title {
    font-weight: $fw-semibold;
    color: $text;
    margin: 0;
  }

  .highlight__desc {
    font-size: $fs-sm;
    color: $muted;
    margin: 2px 0 0;
  }

  :global(.highlight__arrow) {
    color: $muted;
    flex-shrink: 0;
    transition: transform var(--dur-fast) var(--ease-out);
  }

  .highlight__card:hover :global(.highlight__arrow) {
    color: $plum;
    transform: translateX(2px);
  }

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

  .quick--secondary {
    padding-top: $space-9;
    margin-top: $space-6;
    border-top: 1px solid $border;
  }

  .quick__grid {
    display: grid;
    gap: $space-4;
    grid-template-columns: 1fr;
    margin-top: $space-4;

    @media (min-width: #{$bp-md}) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (min-width: #{$bp-lg}) {
      grid-template-columns: repeat(4, 1fr);
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
    flex-shrink: 0;
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

  .quick__link {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    margin-top: $space-4;
    color: $plum;
    font-size: $fs-sm;
    font-weight: $fw-medium;
    transition: gap var(--dur-fast) var(--ease-out);

    &:hover {
      gap: $space-3;
    }
  }

  .quick-skel {
    padding-top: $space-8;
  }

  .quick-empty {
    margin-top: $space-6;
    padding: $space-5;
    background: $surface;
    border: 1px dashed $border;
    border-radius: $radius-md;
    display: flex;
    align-items: center;
    gap: $space-4;
    color: $muted;
  }

  .quick-empty__icon {
    width: 40px;
    height: 40px;
    border-radius: $radius-sm;
    background: $plum-soft;
    color: $plum;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .quick-empty__title {
    font-weight: $fw-medium;
    color: $text;
    margin: 0;
  }

  .quick-empty__desc {
    font-size: $fs-sm;
    color: $muted;
    margin: 2px 0 0;
  }

  .pros {
    list-style: none;
    padding: 0;
    margin: $space-4 0 0;
    display: grid;
    gap: $space-3;
    grid-template-columns: 1fr;

    @media (min-width: #{$bp-md}) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (min-width: #{$bp-lg}) {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .pro {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: $space-3;
    padding: $space-4;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-sm;
    min-width: 0;
  }

  .pro__icon {
    width: 28px;
    height: 28px;
    border-radius: $radius-xs;
    background: $plum-soft;
    color: $plum;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .pro__main {
    min-width: 0;
  }

  .pro__name {
    font-weight: $fw-medium;
    color: $text;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pro__spec {
    font-size: $fs-xs;
    color: $muted;
    margin-top: 2px;
  }
</style>