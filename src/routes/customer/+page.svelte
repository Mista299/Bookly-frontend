<script lang="ts">
  import PageHead from '$lib/components/PageHead.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import Calendar from '$lib/components/Calendar.svelte';
  import StatusPill from '$lib/components/StatusPill.svelte';
  import Money from '$lib/components/Money.svelte';
  import { serviceService } from '$lib/services/service';
  import { bookingService } from '$lib/services/booking';
  import { toasts } from '$lib/stores/toasts';
  import { auth } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import type { Service } from '$lib/types/service';
  import type { Booking, TimeSlot } from '$lib/types/booking';
  import { Search, ArrowRight, Sparkles } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  let services = $state<Service[]>([]);
  let bookings = $state<Booking[]>([]);
  let loadingServices = $state(true);
  let loadingAgenda = $state(true);
  let selectedSlot = $state<string | null>(null);
  let selectedServiceId = $state<string | null>(null);

  const greeting = $derived.by(() => {
    const h = new Date().getHours();
    if (h < 13) return 'Buenos días';
    if (h < 21) return 'Buenas tardes';
    return 'Buenas noches';
  });

  const featured = $derived(services.filter((s) => s.status === 'ACTIVO').slice(0, 4));
  const today = new Date();

  onMount(async () => {
    try {
      services = await serviceService.list();
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'No se pudieron cargar los servicios.';
      toasts.push(msg, 'danger');
    } finally {
      loadingServices = false;
    }

    try {
      const dateStr = today.toISOString().slice(0, 10);
      bookings = await bookingService.list({ date: dateStr });
    } catch {
      // No bloqueante en home.
    } finally {
      loadingAgenda = false;
    }
  });

  function handleSlotClick(slot: TimeSlot) {
    if (slot.state === 'BOOKED') return;
    selectedSlot = slot.start;
    if (selectedServiceId) {
      goto(`/customer/services/${selectedServiceId}`);
    } else if (featured[0]) {
      goto(`/customer/services/${featured[0].id}`);
    } else {
      goto('/customer/services');
    }
  }
</script>

<svelte:head>
  <title>Inicio · BOOKLY</title>
</svelte:head>

<div class="home">
  <header class="home-hero">
    <p class="eyebrow">{greeting}</p>
    <h1 class="home-hero__title">
      {#if $auth.user}
        ¿Qué servicio estás buscando, <span class="home-hero__name">{$auth.user.fullName.split(' ')[0]}</span>?
      {:else}
        ¿Qué servicio estás buscando?
      {/if}
    </h1>
    <a class="home-search" href="/customer/services">
      <Search size={18} />
      <span>Buscar servicios…</span>
    </a>
  </header>

  <section class="featured" data-od-id="customer-featured">
    <header class="featured__head">
      <h2 class="featured__title">Servicios</h2>
      <a class="featured__link" href="/customer/services">
        Ver todos
        <ArrowRight size={14} />
      </a>
    </header>

    {#if loadingServices}
      <div class="featured__grid">
        {#each Array(4) as _, i (i)}
          <Skeleton lines={2} avatar />
        {/each}
      </div>
    {:else if featured.length === 0}
      <EmptyState
        title="Aún no hay servicios disponibles."
        description="Vuelve pronto, estamos preparando nuevas opciones."
      />
    {:else}
      <ul class="featured__grid">
        {#each featured as s (s.id)}
          <li class="service-card">
            <a class="service-card__link" href="/customer/services/{s.id}" data-od-id={`featured-service-${s.id}`}>
              <span class="service-card__icon" aria-hidden="true">
                <Sparkles size={16} />
              </span>
              <div class="service-card__main">
                <p class="service-card__name">{s.name}</p>
                <p class="service-card__meta">{s.category} · {s.durationMinutes} min</p>
              </div>
              <span class="service-card__price"><Money value={s.price} /></span>
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section class="availability" data-od-id="customer-availability">
    <header class="availability__head">
      <h2 class="availability__title">Disponibilidad cercana</h2>
      <p class="availability__date">
        {today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>
    </header>

    {#if loadingAgenda}
      <Skeleton lines={6} />
    {:else}
      <Calendar
        date={today}
        bookings={bookings}
        view="day"
        {selectedSlot}
        onSlotClick={handleSlotClick}
      />
    {/if}
  </section>
</div>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .home {
    padding: $space-7 $space-5 $space-9;
    max-width: 880px;
    margin: 0 auto;

    @media (min-width: #{$bp-md}) {
      padding: $space-9 $space-7 $space-10;
    }
  }

  .home-hero {
    margin-bottom: $space-9;
  }

  .home-hero__title {
    font-family: $font-display;
    font-size: clamp(28px, 5vw, 40px);
    font-weight: $fw-semibold;
    letter-spacing: $ls-display;
    line-height: 1.15;
    margin: $space-3 0 $space-5;
    max-width: 22ch;
  }

  .home-hero__name {
    color: $plum;
  }

  .home-search {
    display: flex;
    align-items: center;
    gap: $space-3;
    padding: $space-4 $space-5;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-md;
    color: $muted;
    font-size: $fs-base;
    transition:
      border-color var(--dur-fast) var(--ease-out),
      box-shadow var(--dur-fast) var(--ease-out);

    &:hover {
      border-color: color.adjust($border, $lightness: -10%);
      color: $text;
    }

    &:focus-visible {
      outline: none;
      border-color: $plum;
      box-shadow: 0 0 0 3px rgba(56, 44, 70, 0.12);
    }
  }

  .featured {
    margin-bottom: $space-10;
  }

  .featured__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: $space-4;
  }

  .featured__title {
    font-size: $fs-xl;
    font-family: $font-display;
    font-weight: $fw-semibold;
    letter-spacing: $ls-tight;
  }

  .featured__link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: $fs-sm;
    color: $plum;
    font-weight: $fw-medium;
    transition: gap var(--dur-fast) var(--ease-out);

    &:hover {
      gap: 10px;
    }
  }

  .featured__grid {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: $space-3;
    grid-template-columns: 1fr;

    @media (min-width: #{$bp-md}) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .service-card {
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-md;
    transition: border-color var(--dur-fast) var(--ease-out);
  }

  .service-card:hover {
    border-color: color.adjust($border, $lightness: -10%);
  }

  .service-card__link {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: $space-3;
    padding: $space-4;
    min-height: 64px;
  }

  .service-card__icon {
    width: 32px;
    height: 32px;
    border-radius: $radius-sm;
    background: $plum-soft;
    color: $plum;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .service-card__main {
    min-width: 0;
  }

  .service-card__name {
    font-weight: $fw-medium;
    color: $text;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .service-card__meta {
    font-size: $fs-xs;
    color: $muted;
    margin-top: 2px;
  }

  .service-card__price {
    font-variant-numeric: tabular-nums;
    font-weight: $fw-medium;
    color: $text;
    font-size: $fs-sm;
  }

  .availability__head {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: $space-4;
  }

  .availability__title {
    font-size: $fs-xl;
    font-family: $font-display;
    font-weight: $fw-semibold;
    letter-spacing: $ls-tight;
  }

  .availability__date {
    font-size: $fs-sm;
    color: $muted;
    text-transform: capitalize;
  }
</style>