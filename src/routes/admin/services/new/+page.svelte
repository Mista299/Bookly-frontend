<script lang="ts">
  import PageHead from '$lib/components/PageHead.svelte';
  import Field from '$lib/components/Field.svelte';
  import Select from '$lib/components/Select.svelte';
  import Switch from '$lib/components/Switch.svelte';
  import Button from '$lib/components/Button.svelte';
  import { serviceService } from '$lib/services/service';
  import { toasts } from '$lib/stores/toasts';
  import { goto } from '$app/navigation';
  import type { ServiceInput } from '$lib/types/service';
  import { ArrowLeft } from 'lucide-svelte';

  const categoryOptions = [
    { value: 'Peluquería', label: 'Peluquería' },
    { value: 'Manos y Pies', label: 'Manos y Pies' },
    { value: 'Estética Facial', label: 'Estética Facial' },
    { value: 'Depilación', label: 'Depilación' },
    { value: 'Maquillaje', label: 'Maquillaje' },
    { value: 'Otro', label: 'Otro' }
  ];

  let name = $state('');
  let category = $state('');
  let description = $state('');
  let duration = $state('30');
  let price = $state('1');
  let active = $state(true);

  let errors = $state<Record<string, string>>({});
  let submitting = $state(false);

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
    const payload: ServiceInput = {
      name: name.trim(),
      category,
      description: description.trim() || undefined,
      durationMinutes: Number(duration),
      price: Number(price)
    };
    submitting = true;
    try {
      const created = await serviceService.create(payload);
      toasts.push('Servicio creado.', 'success');
      await goto(`/admin/services/${created.id}`);
    } catch (err) {
      const e = err as { message?: string; details?: Record<string, string> };
      if (e.details) {
        errors = { ...errors, ...e.details };
      }
      const msg = e.message ?? 'No se pudo crear el servicio.';
      toasts.push(msg, 'danger');
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Nuevo servicio · BOOKLY Administración</title>
</svelte:head>

<a class="back" href="/admin/services">
  <ArrowLeft size={14} /> Servicios
</a>

<PageHead
  eyebrow="Nuevo"
  title="Define un servicio."
  description="Cuanta más claridad aportes en la descripción, más fácil será para clientes y profesionales."
/>

<form class="form" onsubmit={onSubmit} novalidate>
  <div class="form__grid">
    <Field
      label="Nombre"
      bind:value={name}
      error={errors.name ?? null}
      placeholder="Corte y peinado"
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
      placeholder="Qué incluye, para quién es, qué se siente."
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
      min={1}
      max={480}
      step={5}
      bind:value={duration}
      error={errors.duration ?? null}
    />
    <Field
      label="Precio (COP)"
      type="number"
      min={1}
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
    <Button type="submit" loading={submitting}>Crear servicio</Button>
  </div>
</form>

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

    &::placeholder {
      color: color.adjust($muted, $lightness: 12%);
    }

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
</style>