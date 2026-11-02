<script lang="ts">
  import PageHead from '$lib/components/PageHead.svelte';
  import Button from '$lib/components/Button.svelte';
  import Field from '$lib/components/Field.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import { auth } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { toasts } from '$lib/stores/toasts';
  import { formatApiError, isApiError } from '$lib/services/errors';
  import { UserRound, Mail, LogOut, KeyRound } from 'lucide-svelte';

  let showPwd = $state(false);
  let currentPwd = $state('');
  let newPwd = $state('');
  let repeatPwd = $state('');
  let pwdErrors = $state<Record<string, string>>({});
  let pwdServerError = $state<string | null>(null);
  let saving = $state(false);

  function openPwd() {
    currentPwd = '';
    newPwd = '';
    repeatPwd = '';
    pwdErrors = {};
    pwdServerError = null;
    showPwd = true;
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!currentPwd) e.currentPwd = 'Introduce tu contraseña actual.';
    if (newPwd.length < 8) e.newPwd = 'La nueva contraseña debe tener al menos 8 caracteres.';
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/.test(newPwd))
      e.newPwd = 'Debe incluir mayúscula, minúscula, número y carácter especial.';
    if (repeatPwd !== newPwd) e.repeatPwd = 'Las contraseñas no coinciden.';
    pwdErrors = e;
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    saving = true;
    try {
      await auth.changePassword({ currentPassword: currentPwd, newPassword: newPwd });
      toasts.push('Contraseña actualizada.', 'success');
      showPwd = false;
    } catch (err) {
      // El backend responde 401 con INVALID_CREDENTIALS cuando la contraseña
      // ACTUAL es incorrecta. No es una sesión expirada: lo mostramos como
      // error del formulario, no como cierre de sesión.
      const isWrongCurrent = isApiError(err) && err.errorCode === 'INVALID_CREDENTIALS';
      const msg = isWrongCurrent
        ? 'La contraseña actual es incorrecta.'
        : isApiError(err)
          ? formatApiError(err, 'No se pudo cambiar la contraseña.')
          : 'No se pudo cambiar la contraseña.';
      pwdServerError = msg;
      toasts.push(msg, 'danger');
    } finally {
      saving = false;
    }
  }

  function logout() {
    auth.logout();
    toasts.push('Sesión cerrada.', 'info');
    goto('/login');
  }
</script>

<svelte:head>
  <title>Perfil · BOOKLY</title>
</svelte:head>

<div class="page">
  <PageHead
    eyebrow="Tu cuenta"
    title="Perfil."
    description="Datos básicos de tu cuenta en BOOKLY."
  />

  {#if $auth.user}
    <section class="card" data-od-id="customer-profile">
      <header class="card__head">
        <span class="card__avatar" aria-hidden="true">
          <UserRound size={20} />
        </span>
        <div>
          <p class="card__name">{$auth.user.fullName}</p>
          <p class="card__role">Cliente</p>
        </div>
      </header>
      <dl class="card__list">
        <div class="card__row">
          <dt class="card__label">Correo</dt>
          <dd class="card__value">
            <Mail size={14} />
            {$auth.user.email}
          </dd>
        </div>
      </dl>
      <div class="card__actions">
        <Button variant="secondary" onclick={openPwd}>
          <KeyRound size={16} /> Cambiar contraseña
        </Button>
        <Button variant="ghost" onclick={logout}>
          <LogOut size={16} /> Cerrar sesión
        </Button>
      </div>
    </section>
  {/if}
</div>

<Modal
  open={showPwd}
  title="Cambiar contraseña"
  description="Introduce tu contraseña actual y la nueva."
  size="sm"
  onClose={() => (showPwd = false)}
>
  <div class="form-stack">
    {#if pwdServerError}
      <p class="form-error" role="alert">{pwdServerError}</p>
    {/if}
    <Field
      label="Contraseña actual"
      type="password"
      autocomplete="current-password"
      bind:value={currentPwd}
      error={pwdErrors.currentPwd ?? null}
      required
    />
    <Field
      label="Nueva contraseña"
      type="password"
      autocomplete="new-password"
      bind:value={newPwd}
      error={pwdErrors.newPwd ?? null}
      helper="Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo."
      required
    />
    <Field
      label="Repite la nueva contraseña"
      type="password"
      autocomplete="new-password"
      bind:value={repeatPwd}
      error={pwdErrors.repeatPwd ?? null}
      required
    />
  </div>
  {#snippet footer()}
    <Button variant="ghost" onclick={() => (showPwd = false)}>Cancelar</Button>
    <Button onclick={submit} loading={saving}>Guardar</Button>
  {/snippet}
</Modal>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .page {
    padding: $space-7 $space-5 $space-9;
    max-width: 640px;
    margin: 0 auto;

    @media (min-width: #{$bp-md}) {
      padding: $space-9 $space-7;
    }
  }

  .card {
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    padding: $space-6;
  }

  .card__head {
    display: flex;
    align-items: center;
    gap: $space-4;
    margin-bottom: $space-6;
    padding-bottom: $space-5;
    border-bottom: 1px solid $border;
  }

  .card__avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: $plum-soft;
    color: $plum;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .card__name {
    font-family: $font-display;
    font-size: $fs-xl;
    font-weight: $fw-semibold;
    color: $text;
  }

  .card__role {
    font-size: $fs-xs;
    text-transform: uppercase;
    letter-spacing: $ls-wide;
    color: $muted;
    margin-top: 2px;
  }

  .card__list {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  .card__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-3;
  }

  .card__label {
    font-size: $fs-sm;
    color: $muted;
  }

  .card__value {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    font-size: $fs-sm;
    color: $text;
    margin: 0;
  }

  .card__actions {
    margin-top: $space-6;
    padding-top: $space-5;
    border-top: 1px solid $border;
    display: flex;
    flex-wrap: wrap;
    gap: $space-3;
    justify-content: flex-end;
  }

  .form-error {
    font-size: $fs-sm;
    color: $danger;
    margin: 0;
  }

  .form-stack {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }
</style>