<script lang="ts">
  import { page } from '$app/stores';
  import PageHead from '$lib/components/PageHead.svelte';
  import Field from '$lib/components/Field.svelte';
  import Select from '$lib/components/Select.svelte';
  import Switch from '$lib/components/Switch.svelte';
  import Button from '$lib/components/Button.svelte';
  import StatusPill from '$lib/components/StatusPill.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import MultiSelect from '$lib/components/MultiSelect.svelte';
  import { serviceService } from '$lib/services/service';
  import { professionalService } from '$lib/services/professional';
  import { toasts } from '$lib/stores/toasts';
  import { goto } from '$app/navigation';
  import { formatApiError } from '$lib/services/errors';
  import { ArrowLeft } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import type { Professional } from '$lib/types/professional';

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const categoryOptions = [
    { value: 'Peluquería', label: 'Peluquería' },
    { value: 'Manos y Pies', label: 'Manos y Pies' },
    { value: 'Estética Facial', label: 'Estética Facial' },
    { value: 'Depilación', label: 'Depilación' },
    { value: 'Maquillaje', label: 'Maquillaje' },
    { value: 'Otro', label: 'Otro' }
  ];

  const id = $derived($page.params.id);

  let loading = $state(true);
  let saving = $state(false);
  let notFound = $state(false);
  let badId = $state(false);

  let name = $state('');
  let category = $state('');
  let description = $state('');
  let duration = $state('30');
  let price = $state('1');
  let active = $state(true);

  let errors = $state<Record<string, string>>({});

  let allProfessionals = $state<Professional[]>([]);
  let assignedIds = $state<string[]>([]);
  let prosLoading = $state(false);
  let prosSaving = $state(false);

  onMount(async () => {
    if (!UUID_RE.test(id)) {
      badId = true;
      loading = false;
      return;
    }
    try {
      const s = await serviceService.get(id);
      name = s.name;
      category = s.category;
      description = s.description ?? '';
      duration = String(s.durationMinutes);
      price = String(s.price);
      active = s.status === 'ACTIVO';
    } catch (err) {
      const e = err as { status?: number; message?: string };
      if (e.status === 404) notFound = true;
      else toasts.push(e.message ?? 'No se pudo cargar el servicio.', 'danger');
    } finally {
      loading = false;
    }
    await loadProfessionals();
  });

  async function loadProfessionals() {
    if (!UUID_RE.test(id)) return;
    prosLoading = true;
    try {
      const [list, assigned] = await Promise.all([
        professionalService.list(),
        serviceService.listProfessionals(id)
      ]);
      allProfessionals = list;
      assignedIds = assigned.map((p) => p.id);
    } catch (err) {
      toasts.push(formatApiError(err, 'No se pudo cargar la lista de profesionales.'), 'danger');
    } finally {
      prosLoading = false;
    }
  }

  async function saveAssigned(next: string[]) {
    if (!UUID_RE.test(id)) return;
    const previous = assignedIds;
    const removed = previous.filter((pid) => !next.includes(pid));
    const added = next.filter((pid) => !previous.includes(pid));

    if (removed.length === 0 && added.length === 0) {
      assignedIds = next;
      return;
    }

    prosSaving = true;
    try {
      for (const pid of removed) {
        if (pid === id) continue;
        const current = await professionalService.getServiceIds(pid);
        const filtered = current.filter((sid) => sid !== id);
        await professionalService.setServiceIds(pid, filtered);
      }
      for (const pid of added) {
        const current = await professionalService.getServiceIds(pid);
        if (!current.includes(id)) {
          await professionalService.setServiceIds(pid, [...current, id]);
        }
      }
      assignedIds = next;
      toasts.push('Asignación de profesionales actualizada.', 'success');
    } catch (err) {
      assignedIds = previous;
      toasts.push(formatApiError(err, 'No se pudo actualizar la asignación.'), 'danger');
    } finally {
      prosSaving = false;
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'El nombre es obligatorio.';
    if (!category) e.category = 'Selecciona una categoría.';
    const desc = description.trim();
    if (desc && desc.length > 500) e.description = 'La descripción no puede superar 500 caracteres.';
    const durationNum = Number(duration);
    if (!Number.isFinite(durationNum) || durationNum <= 0 || durationNum > 480)
      e.duration = 'La duración debe estar entre 1 y 480 minutos.';
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum <= 0)
      e.price = 'El precio debe ser mayor a 0.';
    errors = e;
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!validate()) return;
    saving = true;
    try {
      await serviceService.update(id, {
        name: name.trim(),
        category,
        description: description.trim() || undefined,
        durationMinutes: Number(duration),
        price: Number(price),
        status: active ? 'ACTIVO' : 'INACTIVO'
      });
      toasts.push('Cambios guardados.', 'success');
    } catch (err) {
      const e = err as { message?: string; details?: Record<string, string> };
      if (e.details) errors = { ...errors, ...e.details };
      const msg = e.message ?? 'No se pudieron guardar los cambios.';
      toasts.push(msg, 'danger');
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>Editar servicio · BOOKLY Administración</title>
</svelte:head>

<a class="back" href="/admin/services">
  <ArrowLeft size={14} /> Servicios
</a>

{#if loading}
  <Skeleton lines={45} />
{:else if notFound}
  <PageHead title="Servicio no encontrado" description="El servicio que buscas ya no existe o fue eliminado." />
  <Button onclick={() => goto('/admin/services')}>Volver al catálogo</Button>
{:else}
  <PageHead
    eyebrow="Servicio"
    title={name || 'Editar servicio'}
    description="Modifica la información del servicio. Los cambios se aplican inmediatamente."
  >
    {#snippet actions()}
      <StatusPill status={active ? 'ACTIVO' : 'INACTIVO'} />
    {/snippet}
  </PageHead>

  <form class="form" onsubmit={onSubmit} novalidate>
    <div class="form__grid">
      <Field
        label="Nombre"
        bind:value={name}
        error={errors.name ?? null}
        required
      />
      <Select
        label="Categoría"
        options={categoryOptions}
        bind:value={category}
        error={errors.category ?? null}
        placeholder="Selecciona una categoría"
        required
      />
    </div>

    <div class="form__field">
      <label class="form__label" for="desc">Descripción</label>
      <textarea
        id="desc"
        class="form__textarea"
        rows="4"
        bind:value={description}
        aria-invalid={!!errors.description}
      ></textarea>
      {#if errors.description}
        <p class="form__error">{errors.description}</p>
      {/if}
    </div>

    <div class="form__grid form__grid--three">
      <Field
        label="Duración (minutos)"
        type="number"
        min={5}
        step={5}
        bind:value={duration}
        error={errors.duration ?? null}
      />
      <Field
        label="Precio (COP)"
        type="number"
        min={0}
        step={0.5}
        bind:value={price}
        error={errors.price ?? null}
      />
      <div class="form__field form__field--switch">
        <span class="form__label">Estado</span>
        <Switch label={active ? 'Activo' : 'Inactivo'} bind:checked={active} />
      </div>
    </div>

    <div class="form__actions">
      <Button variant="ghost" onclick={() => goto('/admin/services')}>Cancelar</Button>
      <Button type="submit" loading={saving}>Guardar cambios</Button>
    </div>
  </form>

  <section class="pros" aria-labelledby="pros-heading">
    <header class="pros__head">
      <h2 id="pros-heading" class="pros__title">Profesionales que ofrecen este servicio</h2>
      <p class="pros__desc">
        Marca los profesionales que pueden tomar reservas de “{name || 'este servicio'}”. Los cambios se
        guardan al instante.
      </p>
    </header>

    {#if prosLoading}
      <Skeleton lines={2} />
    {:else if allProfessionals.length === 0}
      <p class="pros__empty">
        Aún no hay profesionales en el equipo. Añádelos desde el listado de equipo.
      </p>
    {:else}
      <MultiSelect
        items={allProfessionals.map((p) => ({
          value: p.id,
          label: p.fullName,
          hint: p.specialty
        }))}
        selected={assignedIds}
        placeholder="Buscar profesionales…"
        helper={prosSaving ? 'Guardando cambios…' : 'Selecciona uno o varios profesionales.'}
        disabled={prosSaving}
        onChange={(next) => saveAssigned(next)}
      />
    {/if}
  </section>
{/if}

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .back {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    color: $muted;
    font-size: $fs-sm;
    margin-bottom: $space-5;
    transition: color var(--dur-fast) var(--ease-out);

    &:hover {
      color: $plum;
    }
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: $space-6;
    max-width: 720px;
  }

  .form__grid {
    display: grid;
    gap: $space-5;
    grid-template-columns: 1fr;

    @media (min-width: #{$bp-md}) {
      grid-template-columns: 1fr 1fr;
    }

    &--three {
      @media (min-width: #{$bp-md}) {
        grid-template-columns: 1fr 1fr 1fr;
      }
    }
  }

  .form__field {
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }

  .form__field--switch {
    justify-content: center;
  }

  .form__label {
    font-size: $fs-sm;
    font-weight: $fw-medium;
    color: $text;
  }

  .form__textarea {
    width: 100%;
    padding: $space-4;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-md;
    font-family: inherit;
    font-size: $fs-base;
    color: $text;
    line-height: $lh-relaxed;
    resize: vertical;
    transition:
      border-color var(--dur-fast) var(--ease-out),
      box-shadow var(--dur-fast) var(--ease-out);

    &:focus-visible {
      outline: none;
      border-color: $plum;
      box-shadow: 0 0 0 3px rgba(56, 44, 70, 0.12);
    }
  }

  .form__error {
    font-size: $fs-xs;
    color: $danger;
  }

  .form__actions {
    display: flex;
    gap: $space-3;
    justify-content: flex-end;
    margin-top: $space-3;
  }

  .pros {
    margin-top: $space-9;
    padding-top: $space-7;
    border-top: 1px solid $border;
    display: flex;
    flex-direction: column;
    gap: $space-5;
    max-width: 720px;
  }

  .pros__head {
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }

  .pros__title {
    font-family: $font-display;
    font-size: $fs-xl;
    font-weight: $fw-semibold;
    color: $text;
  }

  .pros__desc {
    font-size: $fs-sm;
    color: $muted;
    line-height: $lh-relaxed;
    max-width: 56ch;
  }

  .pros__empty {
    font-size: $fs-sm;
    color: $muted;
    background: $ivory;
    border: 1px dashed $border;
    border-radius: $radius-md;
    padding: $space-4;
  }
</style>