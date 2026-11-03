<script lang="ts">
  import PageHead from '$lib/components/PageHead.svelte';
  import Field from '$lib/components/Field.svelte';
  import Select from '$lib/components/Select.svelte';
  import Button from '$lib/components/Button.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import { userService } from '$lib/services/user';
  import { formatApiError, isApiError } from '$lib/services/errors';
  import { toasts } from '$lib/stores/toasts';
  import type { UserSearchResult } from '$lib/types/user';
  import type { UserRole } from '$lib/types/auth';
  import { Copy, Check, Search, UserCog, KeyRound, X } from 'lucide-svelte';

  const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'CUSTOMER', label: 'Cliente' },
    { value: 'PROFESSIONAL', label: 'Profesional' },
    { value: 'ADMIN', label: 'Administrador' }
  ];

  const roleLabel: Record<UserRole, string> = {
    CUSTOMER: 'Cliente',
    PROFESSIONAL: 'Profesional',
    ADMIN: 'Administrador'
  };

  let query = $state('');
  let results = $state<UserSearchResult[]>([]);
  let searched = $state(false);
  let searching = $state(false);

  let searchToken = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  let roleTarget = $state<UserSearchResult | null>(null);
  let newRole = $state<UserRole>('CUSTOMER');
  let newSpecialty = $state('');
  let savingRole = $state(false);
  let roleError = $state<string | null>(null);

  let passwordTarget = $state<UserSearchResult | null>(null);
  let tempPassword = $state<string | null>(null);
  let tempCopied = $state(false);

  $effect(() => {
    const q = query;
    if (debounceTimer) clearTimeout(debounceTimer);
    const trimmed = q.trim();
    if (trimmed.length === 0) {
      results = [];
      searched = false;
      searching = false;
      return;
    }
    searching = true;
    const myToken = ++searchToken;
    debounceTimer = setTimeout(async () => {
      try {
        const data = await userService.search(trimmed);
        if (myToken !== searchToken) return;
        results = data;
        searched = true;
      } catch (err) {
        if (myToken !== searchToken) return;
        const msg = isApiError(err) ? formatApiError(err, 'No se pudo buscar.') : 'No se pudo buscar.';
        toasts.push(msg, 'danger');
        results = [];
        searched = true;
      } finally {
        if (myToken === searchToken) searching = false;
      }
    }, 280);
  });

  function openRoleModal(u: UserSearchResult) {
    roleTarget = u;
    newRole = u.role;
    newSpecialty = '';
    roleError = null;
  }

  function closeRoleModal() {
    roleTarget = null;
    roleError = null;
  }

  async function confirmRole() {
    if (!roleTarget) return;
    savingRole = true;
    roleError = null;
    try {
      await userService.assignRole(roleTarget.id, {
        role: newRole,
        specialty: newRole === 'PROFESSIONAL' ? newSpecialty.trim() || undefined : undefined
      });
      results = results.map((u) =>
        u.id === roleTarget!.id ? { ...u, role: newRole } : u
      );
      toasts.push('Rol actualizado.', 'success');
      closeRoleModal();
    } catch (err) {
      const apiErr = err as { errorCode?: string; message?: string };
      const msg = isApiError(err)
        ? formatApiError(err, 'No se pudo cambiar el rol.')
        : 'No se pudo cambiar el rol.';
      roleError = msg;
      if (apiErr?.errorCode === 'ROLE_CHANGE_CONFLICT') {
        toasts.push(msg, 'danger');
      }
    } finally {
      savingRole = false;
    }
  }

  async function openPasswordModal(u: UserSearchResult) {
    passwordTarget = u;
    tempPassword = null;
    tempCopied = false;
    try {
      const res = await userService.resetPassword(u.id);
      tempPassword = res.temporaryPassword;
    } catch (err) {
      const msg = isApiError(err)
        ? formatApiError(err, 'No se pudo restablecer la contraseña.')
        : 'No se pudo restablecer la contraseña.';
      toasts.push(msg, 'danger');
      passwordTarget = null;
    }
  }

  function closePasswordModal() {
    passwordTarget = null;
    tempPassword = null;
    tempCopied = false;
  }

  async function copyTemp() {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      tempCopied = true;
      setTimeout(() => (tempCopied = false), 1500);
    } catch {
      tempCopied = false;
    }
  }
</script>

<svelte:head>
  <title>Usuarios · BOOKLY Administración</title>
</svelte:head>

<PageHead
  eyebrow="Equipo"
  title="Usuarios."
  description="Cambia roles, restablece contraseñas, asigna especialidades."
/>

<section class="search" aria-label="Buscar usuarios">
  <label class="search__wrap">
    <span class="search__icon" aria-hidden="true">
      <Search size={16} />
    </span>
    <input
      type="search"
      class="search__input"
      placeholder="Buscar por nombre o correo"
      aria-label="Buscar"
      bind:value={query}
    />
    {#if query}
      <button
        type="button"
        class="search__clear"
        aria-label="Limpiar búsqueda"
        onclick={() => (query = '')}
      >
        <X size={14} />
      </button>
    {/if}
  </label>
</section>

<section class="results" data-od-id="users-results">
  {#if searching}
    <div class="results__list">
      {#each Array(3) as _, i (i)}
        <Skeleton avatar lines={2} />
      {/each}
    </div>
  {:else if !searched}
    <EmptyState
      title="Busca un usuario"
      description="Escribe al menos un carácter para encontrar personas en BOOKLY."
    />
  {:else if results.length === 0}
    <EmptyState
      title="Sin resultados"
      description="No encontramos coincidencias. Prueba con otro correo o nombre."
    />
  {:else}
    <ul class="results__list" role="list">
      {#each results as u (u.id)}
        <li class="user-row" data-od-id={`user-row-${u.id}`}>
          <div class="user-row__main">
            <span class="user-row__avatar" aria-hidden="true">
              {u.fullName.trim().charAt(0).toUpperCase() || '?'}
            </span>
            <div class="user-row__id">
              <p class="user-row__name">{u.fullName}</p>
              <p class="user-row__email">{u.email}</p>
            </div>
          </div>
          <div class="user-row__meta">
            <span class="role-chip role-chip--{u.role.toLowerCase()}">
              {roleLabel[u.role]}
            </span>
          </div>
          <div class="user-row__actions">
            <Button variant="secondary" size="sm" onclick={() => openRoleModal(u)}>
              <UserCog size={14} /> Cambiar rol
            </Button>
            <Button variant="ghost" size="sm" onclick={() => openPasswordModal(u)}>
              <KeyRound size={14} /> Restablecer contraseña
            </Button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<Modal
  open={roleTarget !== null}
  title="Cambiar rol"
  description={roleTarget ? `${roleTarget.fullName} · ${roleTarget.email}` : ''}
  size="sm"
  onClose={closeRoleModal}
>
  <div class="form-stack">
    <Select
      label="Rol"
      bind:value={newRole}
      options={roleOptions}
      required
      error={roleError}
    />
    {#if newRole === 'PROFESSIONAL'}
      <Field
        label="Especialidad"
        bind:value={newSpecialty}
        placeholder="Limpieza dental, Ortodoncia…"
        helper="Opcional. Se muestra a los clientes al reservar."
      />
    {/if}
  </div>
  {#snippet footer()}
    <Button variant="ghost" onclick={closeRoleModal}>Cancelar</Button>
    <Button onclick={confirmRole} loading={savingRole}>Guardar cambio</Button>
  {/snippet}
</Modal>

<Modal
  open={passwordTarget !== null}
  title="Contraseña temporal"
  description={passwordTarget
    ? `${passwordTarget.fullName} deberá cambiarla en su próximo inicio de sesión.`
    : ''}
  size="sm"
  onClose={closePasswordModal}
>
  <div class="pwd-stack">
    <p class="pwd-helper">
      Comparte esta contraseña con la persona indicada y pídele que la cambie al iniciar sesión.
    </p>
    {#if tempPassword}
      <div class="pwd-block">
        <code class="pwd-code">{tempPassword}</code>
        <button
          type="button"
          class="pwd-copy"
          aria-label="Copiar contraseña"
          onclick={copyTemp}
        >
          {#if tempCopied}
            <Check size={14} /> Copiada
          {:else}
            <Copy size={14} /> Copiar
          {/if}
        </button>
      </div>
    {:else}
      <p class="pwd-loading" aria-busy="true">Generando contraseña…</p>
    {/if}
  </div>
  {#snippet footer()}
    <Button variant="ghost" onclick={closePasswordModal}>Cerrar</Button>
  {/snippet}
</Modal>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .search {
    margin-bottom: $space-6;
  }

  .search__wrap {
    position: relative;
    display: block;
    max-width: 480px;
  }

  .search__icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: $muted;
    display: inline-flex;
    pointer-events: none;
  }

  .search__input {
    width: 100%;
    min-height: var(--touch-target);
    padding: 0 $space-9 0 $space-9;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-md;
    font-size: $fs-base;
    color: $text;
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

  .search__clear {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 28px;
    height: 28px;
    border-radius: $radius-sm;
    background: transparent;
    border: 0;
    color: $muted;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: color var(--dur-fast) var(--ease-out);

    &:hover {
      color: $text;
    }
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

  .user-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: $space-4;
    padding: $space-5;
    border-top: 1px solid $border;

    &:first-child {
      border-top: 0;
    }

    @media (min-width: #{$bp-md}) {
      grid-template-columns: minmax(220px, 1.4fr) auto auto;
      gap: $space-6;
      align-items: center;
    }
  }

  .user-row__main {
    display: flex;
    align-items: center;
    gap: $space-3;
    min-width: 0;
  }

  .user-row__avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: $plum-soft;
    color: $plum;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: $font-display;
    font-weight: $fw-semibold;
    font-size: $fs-md;
    flex-shrink: 0;
  }

  .user-row__id {
    min-width: 0;
  }

  .user-row__name {
    font-weight: $fw-semibold;
    color: $text;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .user-row__email {
    font-size: $fs-sm;
    color: $muted;
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .user-row__meta {
    display: flex;
    align-items: center;
  }

  .role-chip {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    font-size: $fs-xs;
    font-weight: $fw-medium;
    padding: 4px 10px;
    border-radius: $radius-pill;
    border: 1px solid transparent;
    letter-spacing: $ls-wide;
    text-transform: uppercase;
  }

  .role-chip--customer {
    background: rgba($success, 0.1);
    color: color.adjust($success, $lightness: -8%);
    border-color: rgba(94, 159, 122, 0.22);
  }

  .role-chip--professional {
    background: $plum-soft;
    color: $plum;
    border-color: rgba(56, 44, 70, 0.18);
  }

  .role-chip--admin {
    background: rgba(232, 124, 104, 0.12);
    color: color.adjust($coral, $lightness: -10%);
    border-color: rgba(232, 124, 104, 0.28);
  }

  .user-row__actions {
    display: inline-flex;
    flex-wrap: wrap;
    gap: $space-2;
    justify-content: flex-start;

    @media (min-width: #{$bp-md}) {
      justify-content: flex-end;
    }
  }

  .form-stack {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  .pwd-stack {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  .pwd-helper {
    font-size: $fs-sm;
    color: $muted;
    line-height: $lh-relaxed;
  }

  .pwd-block {
    display: flex;
    align-items: stretch;
    gap: $space-2;
    background: $ivory;
    border: 1px solid $border;
    border-radius: $radius-md;
    padding: $space-3;
  }

  .pwd-code {
    flex: 1;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: $fs-lg;
    color: $text;
    letter-spacing: 0.04em;
    word-break: break-all;
    display: flex;
    align-items: center;
  }

  .pwd-copy {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: $radius-pill;
    border: 1px solid $border;
    background: $surface;
    color: $text;
    font-size: $fs-sm;
    font-weight: $fw-medium;
    cursor: pointer;
    align-self: flex-start;
    transition:
      background var(--dur-fast) var(--ease-out),
      color var(--dur-fast) var(--ease-out);

    &:hover {
      background: $plum-soft;
      color: $plum;
      border-color: $plum-soft;
    }
  }

  .pwd-loading {
    font-size: $fs-sm;
    color: $muted;
    text-align: center;
    padding: $space-4 0;
  }
</style>