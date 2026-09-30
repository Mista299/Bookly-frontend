<script lang="ts">
  import PageHead from '$lib/components/PageHead.svelte';
  import Field from '$lib/components/Field.svelte';
  import Button from '$lib/components/Button.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import { professionalService } from '$lib/services/professional';
  import { toasts } from '$lib/stores/toasts';
  import { onMount } from 'svelte';
  import type { Professional, ProfessionalInput } from '$lib/types/professional';
  import { Plus, UserRound, X } from 'lucide-svelte';

  let list = $state<Professional[]>([]);
  let loading = $state(true);
  let listUnavailable = $state(false);
  let showForm = $state(false);
  let saving = $state(false);

  let fullName = $state('');
  let email = $state('');
  let password = $state('');
  let specialty = $state('');
  let errors = $state<Record<string, string>>({});

  onMount(async () => {
    try {
      list = await professionalService.list();
    } catch (err) {
      const e = err as { status?: number };
      if (e.status === 404 || e.status === 401 || e.status === 405) {
        listUnavailable = true;
      } else {
        const msg = (err as { message?: string })?.message ?? 'No se pudo cargar el equipo.';
        toasts.push(msg, 'danger');
      }
    } finally {
      loading = false;
    }
  });

  function reset() {
    fullName = '';
    email = '';
    password = '';
    specialty = '';
    errors = {};
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'El nombre es obligatorio.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      e.email = 'Introduce un correo válido.';
    if (password.length < 8)
      e.password = 'La contraseña debe tener al menos 8 caracteres.';
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/.test(password))
      e.password = 'Debe incluir mayúscula, minúscula, número y carácter especial.';
    if (!specialty.trim()) e.specialty = 'La especialidad es obligatoria.';
    errors = e;
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!validate()) return;
    saving = true;
    const payload: ProfessionalInput = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      specialty: specialty.trim()
    };
    try {
      const created = await professionalService.create(payload);
      list = [created, ...list];
      toasts.push('Profesional añadido.', 'success');
      reset();
      showForm = false;
    } catch (err) {
      const e = err as { message?: string; details?: Record<string, string> };
      if (e.details) errors = { ...errors, ...e.details };
      const msg = e.message ?? 'No se pudo añadir al profesional.';
      toasts.push(msg, 'danger');
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>Profesionales · BOOKLY Administración</title>
</svelte:head>

<PageHead
  eyebrow="Equipo"
  title="Profesionales."
  description="Da de alta a las personas que atenderán reservas. Una vez creados, permanecen en el equipo."
>
  {#snippet actions()}
    <Button onclick={() => (showForm = !showForm)}>
      {#if showForm}
        <X size={16} /> Cancelar
      {:else}
        <Plus size={16} /> Añadir profesional
      {/if}
    </Button>
  {/snippet}
</PageHead>

{#if showForm}
  <section class="form-card" data-od-id="professional-create">
    <header class="form-card__head">
      <p class="eyebrow">Nuevo</p>
      <h2 class="form-card__title">Datos del profesional</h2>
    </header>
    <form class="form" onsubmit={onSubmit} novalidate>
      <div class="form__grid">
        <Field
          label="Nombre completo"
          bind:value={fullName}
          error={errors.fullName ?? null}
          placeholder="Nombre y apellido"
          required
        />
        <Field
          label="Especialidad"
          bind:value={specialty}
          error={errors.specialty ?? null}
          placeholder="Limpieza dental"
          required
        />
      </div>
      <Field
        label="Correo"
        type="email"
        bind:value={email}
        error={errors.email ?? null}
        placeholder="profesional@bookly.com"
        autocomplete="email"
        required
      />
      <Field
        label="Contraseña inicial"
        type="password"
        bind:value={password}
        error={errors.password ?? null}
        placeholder="Mínimo 8 caracteres"
        autocomplete="new-password"
        required
      />
      <div class="form__actions">
        <Button variant="ghost" onclick={() => { reset(); showForm = false; }}>Cancelar</Button>
        <Button type="submit" loading={saving}>Añadir al equipo</Button>
      </div>
    </form>
  </section>
{/if}

<section class="team" data-od-id="professionals-list">
  {#if loading}
    <div class="team__list">
      {#each Array(3) as _, i (i)}
        <Skeleton avatar lines={2} />
      {/each}
    </div>
  {:else if listUnavailable}
    <EmptyState
      title="Listado no expuesto en Sprint 1"
      description="El backend todavía no devuelve el equipo; puedes seguir dando altas desde el formulario de arriba."
    />
  {:else if list.length === 0}
    <EmptyState
      title="Aún no hay profesionales"
      description="Cuando añadas al primer miembro del equipo aparecerá aquí."
    >
      {#snippet action()}
        <Button onclick={() => (showForm = true)}>
          <Plus size={16} /> Añadir profesional
        </Button>
      {/snippet}
    </EmptyState>
  {:else}
    <ul class="team__list">
      {#each list as p (p.id)}
        <li class="member">
          <span class="member__avatar" aria-hidden="true">
            <UserRound size={18} />
          </span>
          <div class="member__main">
            <p class="member__name">{p.fullName}</p>
            <p class="member__email">{p.email}</p>
            <p class="member__bio">{p.specialty}</p>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .form-card {
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    padding: $space-6;
    margin-bottom: $space-8;

    @media (min-width: #{$bp-md}) {
      padding: $space-7;
    }
  }

  .form-card__head {
    margin-bottom: $space-6;
  }

  .form-card__title {
    font-size: $fs-xl;
    margin-top: $space-2;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: $space-5;
  }

  .form__grid {
    display: grid;
    gap: $space-5;
    grid-template-columns: 1fr;

    @media (min-width: #{$bp-md}) {
      grid-template-columns: 1fr 1fr;
    }
  }

  .form__actions {
    display: flex;
    gap: $space-3;
    justify-content: flex-end;
  }

  .team__list {
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

  .member {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: $space-4;
    align-items: center;
    padding: $space-5;
    border-top: 1px solid $border;

    &:first-child {
      border-top: 0;
    }
  }

  .member__avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: $plum-soft;
    color: $plum;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .member__main {
    min-width: 0;
  }

  .member__name {
    font-weight: $fw-semibold;
    color: $text;
  }

  .member__email {
    font-size: $fs-sm;
    color: $muted;
    margin-top: 2px;
  }

  .member__bio {
    font-size: $fs-sm;
    color: $muted;
    line-height: $lh-relaxed;
    margin-top: $space-2;
    max-width: 56ch;
  }
</style>