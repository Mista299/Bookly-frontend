<script lang="ts">
  import PageHead from '$lib/components/PageHead.svelte';
  import Button from '$lib/components/Button.svelte';
  import DateTimeInput from '$lib/components/DateTimeInput.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import { auditService } from '$lib/services/audit';
  import { formatApiError, isApiError } from '$lib/services/errors';
  import { toasts } from '$lib/stores/toasts';
  import type { AuditLogResponse, AuditLogPageResponse } from '$lib/types/audit';
  import { ChevronLeft, ChevronRight, FileClock, X } from 'lucide-svelte';

  let from = $state('');
  let to = $state('');
  let page = $state(0);
  const size = 50;

  let data = $state<AuditLogPageResponse | null>(null);
  let loading = $state(false);
  let initial = $state(true);

  const fmt = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short'
  });

  const totalPages = $derived(data?.totalPages ?? 0);
  const currentPage = $derived((data?.page ?? 0) + 1);
  const logs = $derived(data?.content ?? []);

  async function load() {
    loading = true;
    initial = false;
    try {
      data = await auditService.list({
        from: from || undefined,
        to: to || undefined,
        page,
        size
      });
    } catch (err) {
      const msg = isApiError(err)
        ? formatApiError(err, 'No se pudo cargar la auditoría.')
        : 'No se pudo cargar la auditoría.';
      toasts.push(msg, 'danger');
      data = null;
    } finally {
      loading = false;
    }
  }

  function apply() {
    page = 0;
    void load();
  }

  function clear() {
    from = '';
    to = '';
    page = 0;
    void load();
  }

  function nextPage() {
    if (data && page < data.totalPages - 1) {
      page += 1;
      void load();
    }
  }

  function prevPage() {
    if (page > 0) {
      page -= 1;
      void load();
    }
  }

  function formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return fmt.format(d);
    } catch {
      return iso;
    }
  }

  function formatMeta(meta: Record<string, string>): { key: string; value: string }[] {
    return Object.entries(meta).map(([key, value]) => ({ key, value }));
  }
</script>

<svelte:head>
  <title>Auditoría · BOOKLY Administración</title>
</svelte:head>

<PageHead
  eyebrow="Trazabilidad"
  title="Auditoría."
  description="Eventos críticos de la plataforma."
/>

<section class="filters" aria-label="Filtros de auditoría">
  <div class="filters__row">
    <DateTimeInput
      label="Desde"
      name="audit-from"
      bind:value={from}
      helper="Fecha y hora de inicio"
    />
    <DateTimeInput
      label="Hasta"
      name="audit-to"
      bind:value={to}
      helper="Fecha y hora final"
    />
  </div>
  <div class="filters__actions">
    <Button variant="ghost" onclick={clear}>
      <X size={14} /> Limpiar
    </Button>
    <Button onclick={apply}>Aplicar</Button>
  </div>
</section>

<section class="results" data-od-id="audit-results" aria-busy={loading}>
  {#if loading && initial}
    <div class="results__list">
      {#each Array(4) as _, i (i)}
        <Skeleton lines={2} avatar />
      {/each}
    </div>
  {:else if logs.length === 0}
    <EmptyState
      title="Sin eventos"
      description="No hay registros que coincidan con los filtros aplicados."
    >
      {#snippet icon()}
        <FileClock size={22} />
      {/snippet}
    </EmptyState>
  {:else}
    <ul class="results__list" role="list">
      {#each logs as log (log.id)}
        {@const meta = formatMeta(log.metadata)}
        <li class="audit-row" data-od-id={`audit-row-${log.id}`}>
          <div class="audit-row__main">
            <div class="audit-row__head">
              <span class="audit-row__time">{formatDate(log.occurredAt)}</span>
              <span class="action-chip">{log.actionType}</span>
            </div>
            <dl class="audit-row__meta">
              <div class="audit-row__pair">
                <dt>Actor</dt>
                <dd>{log.actorUserId}</dd>
              </div>
              <div class="audit-row__pair">
                <dt>Recurso</dt>
                <dd>{log.resourceType} · {log.resourceId}</dd>
              </div>
              <div class="audit-row__pair">
                <dt>IP</dt>
                <dd>{log.sourceIp}</dd>
              </div>
            </dl>
            {#if meta.length > 0}
              <div class="audit-row__chips" aria-label="Metadatos">
                {#each meta as m (m.key)}
                  <span class="meta-chip">
                    <span class="meta-chip__k">{m.key}</span>
                    <span class="meta-chip__v">{m.value}</span>
                  </span>
                {/each}
              </div>
            {/if}
          </div>
        </li>
      {/each}
    </ul>

    {#if totalPages > 1}
      <nav class="pager" aria-label="Paginación">
        <Button
          variant="secondary"
          size="sm"
          onclick={prevPage}
          disabled={page === 0 || loading}
          aria-label="Página anterior"
        >
          <ChevronLeft size={14} /> Anterior
        </Button>
        <p class="pager__info" aria-live="polite">
          Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
        </p>
        <Button
          variant="secondary"
          size="sm"
          onclick={nextPage}
          disabled={!data || page >= data.totalPages - 1 || loading}
          aria-label="Página siguiente"
        >
          Siguiente <ChevronRight size={14} />
        </Button>
      </nav>
    {/if}
  {/if}
</section>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .filters {
    display: flex;
    flex-direction: column;
    gap: $space-4;
    margin-bottom: $space-6;
    padding: $space-5 $space-5;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;

    @media (min-width: #{$bp-md}) {
      flex-direction: row;
      align-items: flex-end;
      justify-content: space-between;
      gap: $space-5;
    }
  }

  .filters__row {
    display: grid;
    gap: $space-4;
    grid-template-columns: 1fr;
    flex: 1;

    @media (min-width: #{$bp-sm}) {
      grid-template-columns: 1fr 1fr;
    }
  }

  .filters__actions {
    display: flex;
    gap: $space-3;
    flex-shrink: 0;
  }

  .results__list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    overflow: hidden;
  }

  .audit-row {
    padding: $space-5;
    border-top: 1px solid $border;

    &:first-child {
      border-top: 0;
    }
  }

  .audit-row__main {
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }

  .audit-row__head {
    display: flex;
    align-items: center;
    gap: $space-3;
    flex-wrap: wrap;
  }

  .audit-row__time {
    font-family: $font-display;
    font-weight: $fw-semibold;
    font-size: $fs-md;
    color: $text;
    letter-spacing: $ls-tight;
  }

  .action-chip {
    display: inline-flex;
    align-items: center;
    font-size: $fs-xs;
    font-weight: $fw-medium;
    padding: 4px 10px;
    border-radius: $radius-pill;
    background: $plum-soft;
    color: $plum;
    border: 1px solid rgba(56, 44, 70, 0.18);
    letter-spacing: $ls-wide;
    text-transform: uppercase;
  }

  .audit-row__meta {
    display: grid;
    grid-template-columns: 1fr;
    gap: $space-2;
    margin: 0;

    @media (min-width: #{$bp-md}) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: $space-4;
    }
  }

  .audit-row__pair {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    dt {
      font-size: $fs-xs;
      text-transform: uppercase;
      letter-spacing: $ls-wide;
      color: $muted;
      font-weight: $fw-medium;
    }

    dd {
      font-size: $fs-sm;
      color: $text;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .audit-row__chips {
    display: flex;
    flex-wrap: wrap;
    gap: $space-2;
  }

  .meta-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: $fs-xs;
    padding: 3px 8px;
    border-radius: $radius-sm;
    background: $ivory;
    border: 1px solid $border;
    color: $muted;
    max-width: 100%;
  }

  .meta-chip__k {
    color: $muted;
    font-weight: $fw-medium;
  }

  .meta-chip__v {
    color: $text;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 220px;
  }

  .pager {
    margin-top: $space-5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-3;
    flex-wrap: wrap;
  }

  .pager__info {
    font-size: $fs-sm;
    color: $muted;

    strong {
      color: $text;
      font-weight: $fw-semibold;
    }
  }
</style>