<script lang="ts">
  import PageHead from '$lib/components/PageHead.svelte';
  import Field from '$lib/components/Field.svelte';
  import Button from '$lib/components/Button.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import MultiSelect from '$lib/components/MultiSelect.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import { professionalService } from '$lib/services/professional';
  import { serviceService } from '$lib/services/service';
  import { userService } from '$lib/services/user';
  import { toasts } from '$lib/stores/toasts';
  import { formatApiError } from '$lib/services/errors';
  import { onMount } from 'svelte';
  import type { Professional, ProfessionalInput } from '$lib/types/professional';
  import type { Service } from '$lib/types/service';
  import { Plus, X, Copy, Check, KeyRound, Settings2, CalendarDays } from 'lucide-svelte';

  let list = $state<Professional[]>([]);
  let loading = $state(true);
  let assignedCounts = $state<Record<string, number>>({});
  let allServices = $state<Service[]>([]);

  let showForm = $state(false);
  let saving = $state(false);

  let fullName = $state('');
  let email = $state('');
  let password = $state('');
  let specialty = $state('');
  let errors = $state<Record<string, string>>({});

  let servicesModalOpen = $state(false);
  let servicesModalProfessional = $state<Professional | null>(null);
  let servicesModalSelected = $state<string[]>([]);
  let servicesModalInitial = $state<string[]>([]);
  let servicesModalLoading = $state(false);
  let servicesModalSaving = $state(false);

  let pwdModalOpen = $state(false);
  let pwdModalProfessional = $state<Professional | null>(null);
  let pwdModalValue = $state('');
  let pwdModalCopied = $state(false);
  let pwdModalLoading = $state(false);

  onMount(async () => {
    await Promise.all([loadList(), loadServices()]);
  });

  async function loadList() {
    loading = true;
    try {
      list = await professionalService.list();
      await refreshAssignedCounts();
    } catch (err) {
      toasts.push(formatApiError(err, 'No se pudo cargar el equipo.'), 'danger');
    } finally {
      loading = false;
    }
  }

  async function loadServices() {
    try {
      allServices = await serviceService.list();
    } catch (err) {
      toasts.push(formatApiError(err, 'No se pudieron cargar los servicios.'), 'danger');
    }
  }

  async function refreshAssignedCounts() {
    const entries = await Promise.all(
      list.map(async (p) => {
        try {
          const ids = await professionalService.getServiceIds(p.id);
          return [p.id, ids.length] as const;
        } catch {
          return [p.id, 0] as const;
        }
      })
    );
    const next: Record<string, number> = {};
    for (const [id, count] of entries) next[id] = count;
    assignedCounts = next;
  }

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
      assignedCounts = { ...assignedCounts, [created.id]: 0 };
      toasts.push('Profesional añadido.', 'success');
      reset();
      showForm = false;
    } catch (err) {
      const detailErr = err as { details?: Record<string, string> };
      if (detailErr.details) errors = { ...errors, ...detailErr.details };
      toasts.push(formatApiError(err, 'No se pudo añadir al profesional.'), 'danger');
    } finally {
      saving = false;
    }
  }

  function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  async function openServicesModal(p: Professional) {
    servicesModalProfessional = p;
    servicesModalOpen = true;
    servicesModalLoading = true;
    try {
      const ids = await professionalService.getServiceIds(p.id);
      servicesModalSelected = ids;
      servicesModalInitial = ids;
    } catch (err) {
      toasts.push(formatApiError(err, 'No se pudieron cargar los servicios del profesional.'), 'danger');
      servicesModalSelected = [];
      servicesModalInitial = [];
    } finally {
      servicesModalLoading = false;
    }
  }

  function closeServicesModal() {
    servicesModalOpen = false;
    servicesModalProfessional = null;
    servicesModalSelected = [];
    servicesModalInitial = [];
  }

  async function saveServicesModal() {
    if (!servicesModalProfessional) return;
    servicesModalSaving = true;
    try {
      await professionalService.setServiceIds(servicesModalProfessional.id, servicesModalSelected);
      assignedCounts = { ...assignedCounts, [servicesModalProfessional.id]: servicesModalSelected.length };
      servicesModalInitial = servicesModalSelected;
      toasts.push('Servicios actualizados.', 'success');
      closeServicesModal();
    } catch (err) {
      toasts.push(formatApiError(err, 'No se pudieron guardar los servicios.'), 'danger');
    } finally {
      servicesModalSaving = false;
    }
  }

  function cancelServicesModal() {
    servicesModalSelected = servicesModalInitial;
    closeServicesModal();
  }

  async function openPasswordModal(p: Professional) {
    pwdModalProfessional = p;
    pwdModalValue = '';
    pwdModalCopied = false;
    pwdModalOpen = true;
    pwdModalLoading = true;
    try {
      const res = await userService.resetPassword(p.id);
      pwdModalValue = res.temporaryPassword;
      toasts.push(`Contraseña temporal generada para ${p.fullName}.`, 'info');
    } catch (err) {
      toasts.push(formatApiError(err, 'No se pudo restablecer la contraseña.'), 'danger');
      closePasswordModal();
    } finally {
      pwdModalLoading = false;
    }
  }

  function closePasswordModal() {
    pwdModalOpen = false;
    pwdModalProfessional = null;
    pwdModalValue = '';
    pwdModalCopied = false;
  }

  async function copyPassword() {
    if (!pwdModalValue) return;
    try {
      await navigator.clipboard.writeText(pwdModalValue);
      pwdModalCopied = true;
      setTimeout(() => (pwdModalCopied = false), 1500);
    } catch {
      pwdModalCopied = false;
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
        helper="8+ caracteres, mayúscula, minúscula, número y carácter especial."
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
          <span class="member__avatar" aria-hidden="true">{initials(p.fullName) || '?'}</span>
          <div class="member__main">
            <p class="member__name">{p.fullName}</p>
            <p class="member__email">{p.email}</p>
            <p class="member__bio">
              <span class="member__chip">{p.specialty}</span>
              <span class="member__chip member__chip--soft">
                {assignedCounts[p.id] ?? 0}
                {(assignedCounts[p.id] ?? 0) === 1 ? 'servicio' : 'servicios'}
              </span>
            </p>
          </div>
          <div class="member__actions">
            <a
              class="action"
              href={`/admin/agenda?professionalId=${encodeURIComponent(p.id)}`}
              aria-label={`Ver agenda de ${p.fullName}`}
            >
              <CalendarDays size={14} /> Ver agenda
            </a>
            <button
              type="button"
              class="action"
              onclick={() => openServicesModal(p)}
              aria-label={`Editar servicios de ${p.fullName}`}
            >
              <Settings2 size={14} /> Editar servicios
            </button>
            <button
              type="button"
              class="action"
              onclick={() => openPasswordModal(p)}
              aria-label={`Restablecer contraseña de ${p.fullName}`}
            >
              <KeyRound size={14} /> Restablecer clave
            </button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<Modal
  open={servicesModalOpen}
  title="Servicios del profesional"
  description={servicesModalProfessional
    ? `Asigna los servicios que ${servicesModalProfessional.fullName} puede ofrecer.`
    : ''}
  size="md"
  onClose={cancelServicesModal}
>
  {#if servicesModalLoading}
    <Skeleton lines={3} />
  {:else}
    <MultiSelect
      items={allServices.map((s) => ({
        value: s.id,
        label: s.name,
        hint: s.status === 'ACTIVO' ? s.category : `${s.category} · inactivo`
      }))}
      selected={servicesModalSelected}
      placeholder="Buscar servicios…"
      emptyText="No hay servicios en el catálogo"
      helper={servicesModalSaving ? 'Guardando cambios…' : 'Puedes asignar varios a la vez.'}
      disabled={servicesModalSaving}
      onChange={(next) => (servicesModalSelected = next)}
    />
  {/if}

  {#snippet footer()}
    <Button variant="ghost" onclick={cancelServicesModal} disabled={servicesModalSaving}>
      Cancelar
    </Button>
    <Button
      onclick={saveServicesModal}
      loading={servicesModalSaving}
      disabled={servicesModalLoading}
    >
      Guardar servicios
    </Button>
  {/snippet}
</Modal>

<Modal
  open={pwdModalOpen}
  title="Contraseña temporal"
  description={pwdModalProfessional
    ? `Esta es la contraseña temporal de ${pwdModalProfessional.fullName}. Compártela por un canal seguro; el profesional deberá cambiarla al iniciar sesión.`
    : ''}
  size="sm"
  onClose={closePasswordModal}
>
  {#if pwdModalLoading}
    <Skeleton lines={2} />
  {:else}
    <div class="pwd">
      <code class="pwd__code" aria-label="Contraseña temporal">{pwdModalValue}</code>
      <button
        type="button"
        class="pwd__copy"
        onclick={copyPassword}
        aria-label="Copiar contraseña"
        disabled={!pwdModalValue}
      >
        {#if pwdModalCopied}<Check size={14} /> Copiada{:else}<Copy size={14} /> Copiar{/if}
      </button>
    </div>
  {/if}

  {#snippet footer()}
    <Button onclick={closePasswordModal}>Cerrar</Button>
  {/snippet}
</Modal>

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
    grid-template-columns: auto 1fr;
    gap: $space-4;
    align-items: center;
    padding: $space-5;
    border-top: 1px solid $border;

    &:first-child {
      border-top: 0;
    }

    @media (min-width: #{$bp-md}) {
      grid-template-columns: auto 1fr auto;
    }
  }

  .member__avatar {
    width: 40px;
    height: 40px;
    border-radius: $radius-pill;
    background: $plum-soft;
    color: $plum;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: $font-display;
    font-weight: $fw-semibold;
    font-size: $fs-sm;
    letter-spacing: 0.04em;
    flex-shrink: 0;
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
    display: flex;
    flex-wrap: wrap;
    gap: $space-2;
  }

  .member__chip {
    display: inline-flex;
    align-items: center;
    padding: 2px 10px;
    border-radius: $radius-pill;
    background: $plum-soft;
    color: $plum;
    font-size: $fs-xs;
    font-weight: $fw-medium;

    &--soft {
      background: $ivory;
      color: $muted;
      border: 1px solid $border;
    }
  }

  .member__actions {
    display: flex;
    flex-wrap: wrap;
    gap: $space-2;
    grid-column: 1 / -1;
    margin-top: $space-3;

    @media (min-width: #{$bp-md}) {
      grid-column: auto;
      flex-direction: column;
      align-items: flex-end;
      gap: $space-2;
      margin-top: 0;
    }
  }

  .action {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: $radius-pill;
    border: 1px solid $border;
    background: $surface;
    color: $text;
    font-size: $fs-xs;
    font-weight: $fw-medium;
    cursor: pointer;
    transition:
      background var(--dur-fast) var(--ease-out),
      color var(--dur-fast) var(--ease-out),
      border-color var(--dur-fast) var(--ease-out);
    text-decoration: none;

    &:hover {
      background: $plum-soft;
      color: $plum;
      border-color: $plum-soft;
    }

    @media (min-width: #{$bp-md}) {
      padding: 4px 10px;
      font-size: $fs-xs;
    }
  }

  .pwd {
    display: flex;
    align-items: center;
    gap: $space-3;
    padding: $space-4;
    background: $ivory;
    border: 1px solid $border;
    border-radius: $radius-md;
  }

  .pwd__code {
    flex: 1;
    font-family: $font-display;
    font-size: $fs-xl;
    color: $text;
    letter-spacing: 0.08em;
    word-break: break-all;
  }

  .pwd__copy {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: $plum;
    color: $white;
    border: 0;
    padding: 8px 14px;
    border-radius: $radius-md;
    font-size: $fs-sm;
    font-weight: $fw-medium;
    cursor: pointer;

    &:hover:not(:disabled) {
      background: color.adjust($plum, $lightness: 4%);
    }

    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
  }
</style>