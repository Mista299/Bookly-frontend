<script lang="ts">
  import PageHead from '$lib/components/PageHead.svelte';
  import Button from '$lib/components/Button.svelte';
  import StatusPill from '$lib/components/StatusPill.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Money from '$lib/components/Money.svelte';
  import { serviceService } from '$lib/services/service';
  import { toasts } from '$lib/stores/toasts';
  import { onMount } from 'svelte';
  import type { Service } from '$lib/types/service';
  import { Plus, Search, Scissors, Power, Pencil, Trash2 } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  let services = $state<Service[]>([]);
  let loading = $state(true);
  let query = $state('');
  let statusFilter = $state<'ALL' | 'ACTIVO' | 'INACTIVO'>('ALL');
  let confirmDeleteId = $state<string | null>(null);

  const filtered = $derived(
    services.filter((s) => {
      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
      const q = query.trim().toLowerCase();
      const desc = s.description?.toLowerCase() ?? '';
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        desc.includes(q);
      return matchesStatus && matchesQuery;
    })
  );

  const deleteTarget = $derived(services.find((s) => s.id === confirmDeleteId) ?? null);

  onMount(async () => {
    await load();
  });

  async function load() {
    loading = true;
    try {
      services = await serviceService.list();
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'No se pudieron cargar los servicios.';
      toasts.push(msg, 'danger');
    } finally {
      loading = false;
    }
  }

  async function toggleStatus(s: Service) {
    const next = s.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      const updated = await serviceService.setStatus(s.id, next, s);
      services = services.map((it) => (it.id === s.id ? updated : it));
      toasts.push(
        next === 'ACTIVO' ? 'Servicio activado.' : 'Servicio desactivado.',
        'success'
      );
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'No se pudo cambiar el estado.';
      toasts.push(msg, 'danger');
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await serviceService.remove(deleteTarget.id);
      services = services.filter((it) => it.id !== deleteTarget.id);
      toasts.push('Servicio eliminado.', 'success');
      confirmDeleteId = null;
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'No se pudo eliminar.';
      toasts.push(msg, 'danger');
    }
  }
</script>

<svelte:head>
  <title>Servicios · BOOKLY Administración</title>
</svelte:head>

<PageHead
  eyebrow="Catálogo"
  title="Servicios."
  description="Crea, edita y controla la disponibilidad de los servicios que se ofrecen."
>
  {#snippet actions()}
    <Button onclick={() => goto('/admin/services/new')}>
      <Plus size={16} /> Nuevo servicio
    </Button>
  {/snippet}
</PageHead>

<div class="filters" role="search">
  <label class="filters__search">
    <Search size={16} class="filters__icon" />
    <input
      type="search"
      placeholder="Buscar por nombre, categoría o descripción"
      bind:value={query}
      aria-label="Buscar servicios"
    />
  </label>
  <div class="filters__chips">
    {#each [['ALL', 'Todos'], ['ACTIVO', 'Activos'], ['INACTIVO', 'Inactivos']] as [val, lbl] (val)}
      <button
        type="button"
        class="chip"
        class:is-active={statusFilter === val}
        onclick={() => (statusFilter = val as typeof statusFilter)}
      >
        {lbl}
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
    title={services.length === 0 ? 'Aún no hay servicios' : 'Sin resultados'}
    description={services.length === 0
      ? 'Empieza creando el primer servicio del catálogo.'
      : 'Prueba con otra búsqueda o cambia el filtro de estado.'}
  >
    {#snippet action()}
      {#if services.length === 0}
        <Button onclick={() => goto('/admin/services/new')}>
          <Plus size={16} /> Crear servicio
        </Button>
      {/if}
    {/snippet}
  </EmptyState>
{:else}
  <ul class="list" data-od-id="services-list">
    {#each filtered as s (s.id)}
      <li class="row" data-od-id={`service-row-${s.id}`}>
        <div class="row__lead">
          <span class="row__icon" aria-hidden="true"><Scissors size={16} /></span>
          <div class="row__heading">
            <a class="row__name" href="/admin/services/{s.id}">{s.name}</a>
            <p class="row__meta">
              <span>{s.category}</span>
              <span aria-hidden="true">·</span>
              <span>{s.durationMinutes} min</span>
            </p>
          </div>
        </div>
        <p class="row__desc">{s.description}</p>
        <div class="row__pricing">
          <Money value={s.price} />
          <StatusPill status={s.status} />
        </div>
        <div class="row__actions">
          <button
            type="button"
            class="row__action"
            aria-label={s.status === 'ACTIVO' ? 'Desactivar' : 'Activar'}
            onclick={() => toggleStatus(s)}
          >
            <Power size={16} />
          </button>
          <a class="row__action" aria-label="Editar" href="/admin/services/{s.id}">
            <Pencil size={16} />
          </a>
          <button
            type="button"
            class="row__action row__action--danger"
            aria-label="Eliminar"
            onclick={() => (confirmDeleteId = s.id)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </li>
    {/each}
  </ul>
{/if}

<Modal
  open={confirmDeleteId !== null}
  title="Eliminar servicio"
  description={deleteTarget ? `“${deleteTarget.name}” dejará de estar disponible.` : ''}
  size="sm"
  onClose={() => (confirmDeleteId = null)}
>
  <p class="modal-body">
    Esta acción no se puede deshacer. El servicio se eliminará del catálogo y no podrá recuperarse.
  </p>
  {#snippet footer()}
    <Button variant="ghost" onclick={() => (confirmDeleteId = null)}>Cancelar</Button>
    <Button variant="danger" onclick={confirmDelete}>Eliminar</Button>
  {/snippet}
</Modal>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .filters {
    display: flex;
    flex-direction: column;
    gap: $space-4;
    margin-bottom: $space-6;

    @media (min-width: #{$bp-md}) {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }

  .filters__search {
    position: relative;
    flex: 1;
    max-width: 480px;

    input {
      width: 100%;
      min-height: var(--touch-target);
      padding: 0 $space-4 0 $space-9;
      background: $surface;
      border: 1px solid $border;
      border-radius: $radius-md;
      font-size: $fs-base;

      &:focus-visible {
        outline: none;
        border-color: $plum;
        box-shadow: 0 0 0 3px rgba(56, 44, 70, 0.12);
      }
    }

    :global(.filters__icon) {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: $muted;
    }
  }

  .filters__chips {
    display: inline-flex;
    gap: 2px;
    padding: 3px;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-pill;
  }

  .chip {
    border: 0;
    background: transparent;
    padding: 6px 14px;
    border-radius: $radius-pill;
    font-size: $fs-sm;
    color: $muted;
    cursor: pointer;
    transition:
      background var(--dur-fast) var(--ease-out),
      color var(--dur-fast) var(--ease-out);

    &:hover {
      color: $text;
    }

    &.is-active {
      background: $plum;
      color: $white;
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
    display: grid;
    grid-template-columns: 1fr;
    gap: $space-3;
    padding: $space-5 $space-5;
    border-top: 1px solid $border;
    transition: background var(--dur-fast) var(--ease-out);

    &:first-child {
      border-top: 0;
    }

    &:hover {
      background: rgba(248, 246, 242, 0.6);
    }

    @media (min-width: #{$bp-lg}) {
      grid-template-columns: minmax(220px, 1.4fr) minmax(220px, 2fr) auto auto;
      align-items: center;
      gap: $space-6;
    }
  }

  .row__lead {
    display: flex;
    align-items: center;
    gap: $space-3;
    min-width: 0;
  }

  .row__icon {
    width: 36px;
    height: 36px;
    background: $plum-soft;
    color: $plum;
    border-radius: $radius-sm;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .row__heading {
    min-width: 0;
  }

  .row__name {
    font-family: $font-display;
    font-weight: $fw-semibold;
    font-size: $fs-md;
    color: $text;
    letter-spacing: $ls-tight;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
    max-width: 100%;

    &:hover {
      color: $plum;
    }
  }

  .row__meta {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    font-size: $fs-xs;
    color: $muted;
    margin-top: 2px;
  }

  .row__desc {
    font-size: $fs-sm;
    color: $muted;
    line-height: $lh-relaxed;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .row__pricing {
    display: inline-flex;
    align-items: center;
    gap: $space-4;
    font-size: $fs-md;
    color: $text;
    font-weight: $fw-semibold;
  }

  .row__actions {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    justify-content: flex-end;
  }

  .row__action {
    background: transparent;
    border: 1px solid $border;
    color: $muted;
    width: 36px;
    height: 36px;
    border-radius: $radius-sm;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition:
      background var(--dur-fast) var(--ease-out),
      color var(--dur-fast) var(--ease-out),
      border-color var(--dur-fast) var(--ease-out);

    &:hover {
      color: $plum;
      border-color: color.adjust($border, $lightness: -10%);
      background: $ivory;
    }
  }

  .row__action--danger:hover {
    color: $danger;
    border-color: color.adjust($danger, $lightness: 25%);
    background: rgba(217, 107, 104, 0.06);
  }

  .modal-body {
    font-size: $fs-sm;
    color: $muted;
    line-height: $lh-relaxed;
  }
</style>