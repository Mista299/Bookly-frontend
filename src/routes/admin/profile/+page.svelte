<script lang="ts">
  import PageHead from '$lib/components/PageHead.svelte';
  import Field from '$lib/components/Field.svelte';
  import Button from '$lib/components/Button.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import OtpInput from '$lib/components/OtpInput.svelte';
  import CodeBlock from '$lib/components/CodeBlock.svelte';
  import { auth } from '$lib/stores/auth';
  import { toasts } from '$lib/stores/toasts';
  import { formatApiError, isApiError } from '$lib/services/errors';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { MfaRecoveryCodesResponse, MfaRecoveryStatusResponse } from '$lib/types/mfa';
  import { LogOut, ShieldCheck, ShieldOff, RefreshCw, KeyRound, Mail, UserRound, AlertTriangle } from 'lucide-svelte';

  let showChangePwd = $state(false);
  let currentPwd = $state('');
  let newPwd = $state('');
  let repeatPwd = $state('');
  let pwdErrors = $state<Record<string, string>>({});
  let pwdServerError = $state<string | null>(null);
  let savingPwd = $state(false);

  let mfaStatus = $state<MfaRecoveryStatusResponse | null>(null);
  let mfaError = $state<string | null>(null);
  let mfaLoading = $state(true);

  let showDisable = $state(false);
  let disablePwd = $state('');
  let disableCode = $state('');
  let disableError = $state<string | null>(null);
  let disabling = $state(false);

  let showRegen = $state(false);
  let regenCode = $state('');
  let regenError = $state<string | null>(null);
  let regenerating = $state(false);
  let regenResult = $state<MfaRecoveryCodesResponse | null>(null);

  let logoutLoading = $state(false);

  onMount(async () => {
    try {
      mfaStatus = await auth.getMfaRecoveryStatus();
    } catch (err) {
      const e = err as { status?: number };
      if (e.status === 404 || e.status === 405) {
        mfaStatus = null;
      } else {
        mfaError = isApiError(err)
          ? formatApiError(err, 'No se pudo consultar MFA.')
          : 'No se pudo consultar MFA.';
      }
    } finally {
      mfaLoading = false;
    }
  });

  function openChangePwd() {
    currentPwd = '';
    newPwd = '';
    repeatPwd = '';
    pwdErrors = {};
    pwdServerError = null;
    showChangePwd = true;
  }

  function validatePwd(): boolean {
    const e: Record<string, string> = {};
    if (!currentPwd) e.currentPwd = 'Introduce tu contraseña actual.';
    if (newPwd.length < 8) e.newPwd = 'La nueva contraseña debe tener al menos 8 caracteres.';
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/.test(newPwd))
      e.newPwd = 'Debe incluir mayúscula, minúscula, número y carácter especial.';
    if (repeatPwd !== newPwd) e.repeatPwd = 'Las contraseñas no coinciden.';
    pwdErrors = e;
    return Object.keys(e).length === 0;
  }

  async function submitChangePwd() {
    if (!validatePwd()) return;
    savingPwd = true;
    pwdServerError = null;
    try {
      await auth.changePassword({ currentPassword: currentPwd, newPassword: newPwd });
      toasts.push('Contraseña actualizada.', 'success');
      showChangePwd = false;
    } catch (err) {
      // El backend responde 401 con INVALID_CREDENTIALS cuando la contraseña
      // actual no es la correcta. No es una sesión expirada: lo mostramos
      // como error del formulario.
      const isWrongCurrent = isApiError(err) && err.errorCode === 'INVALID_CREDENTIALS';
      const msg = isWrongCurrent
        ? 'La contraseña actual es incorrecta.'
        : isApiError(err)
          ? formatApiError(err, 'No se pudo cambiar la contraseña.')
          : 'No se pudo cambiar la contraseña.';
      // El error se muestra dentro del modal (donde el usuario está mirando)
      // además del toast: un toast se pasa desapercibido con facilidad.
      pwdServerError = msg;
      toasts.push(msg, 'danger');
    } finally {
      savingPwd = false;
    }
  }

  function openDisable() {
    disablePwd = '';
    disableCode = '';
    disableError = null;
    showDisable = true;
  }

  async function submitDisable() {
    if (disableCode.length !== 6) {
      disableError = 'Introduce un código de 6 dígitos.';
      return;
    }
    disabling = true;
    disableError = null;
    try {
      await auth.disableMfa({ password: disablePwd, code: disableCode });
      toasts.push('Segundo factor desactivado.', 'success');
      showDisable = false;
      mfaStatus = null;
    } catch (err) {
      disableError = isApiError(err)
        ? formatApiError(err, 'No se pudo desactivar.')
        : 'No se pudo desactivar.';
    } finally {
      disabling = false;
    }
  }

  function openRegen() {
    regenCode = '';
    regenError = null;
    regenResult = null;
    showRegen = true;
  }

  async function submitRegen() {
    if (regenCode.length !== 6) {
      regenError = 'Introduce un código de 6 dígitos.';
      return;
    }
    regenerating = true;
    regenError = null;
    try {
      regenResult = await auth.regenerateRecoveryCodes({ code: regenCode });
    } catch (err) {
      regenError = isApiError(err)
        ? formatApiError(err, 'No se pudieron regenerar.')
        : 'No se pudieron regenerar.';
    } finally {
      regenerating = false;
    }
  }

  function closeRegen() {
    showRegen = false;
    regenResult = null;
    if (regenResult) {
      mfaStatus = { remaining: regenResult.recoveryCodes.length };
      toasts.push('Códigos regenerados.', 'success');
    }
  }

  async function logout() {
    logoutLoading = true;
    auth.logout();
    toasts.push('Sesión cerrada.', 'info');
    await goto('/login');
  }
</script>

<svelte:head>
  <title>Perfil · BOOKLY Administración</title>
</svelte:head>

<div class="page">
  <PageHead
    eyebrow="Tu cuenta"
    title="Perfil."
    description="Datos básicos, contraseña y segundo factor de tu cuenta."
  />

  {#if $auth.user}
    <section class="card" data-od-id="admin-profile">
      <header class="card__head">
        <span class="card__avatar" aria-hidden="true">
          <UserRound size={20} />
        </span>
        <div>
          <p class="card__name">{$auth.user.fullName}</p>
          <p class="card__role">Administrador</p>
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
        <Button variant="ghost" onclick={logout} loading={logoutLoading}>
          <LogOut size={16} /> Cerrar sesión
        </Button>
      </div>
    </section>

    <section class="card" data-od-id="admin-profile-password" aria-labelledby="pwd-title">
      <header class="section-head">
        <div>
          <h2 class="section-title" id="pwd-title">Cambiar contraseña</h2>
          <p class="section-desc">Actualízala periódicamente para mantener tu cuenta segura.</p>
        </div>
        <Button variant="secondary" onclick={openChangePwd}>
          <KeyRound size={16} /> Cambiar contraseña
        </Button>
      </header>
    </section>

    <section class="card" data-od-id="admin-profile-mfa" aria-labelledby="mfa-title">
      <header class="section-head">
        <div>
          <h2 class="section-title" id="mfa-title">Segundo factor (MFA)</h2>
          <p class="section-desc">Protege tu cuenta con un código temporal además de la contraseña.</p>
        </div>
        {#if mfaStatus}
          <span class="mfa-status mfa-status--on">
            <ShieldCheck size={14} /> Activo
          </span>
        {:else}
          <span class="mfa-status mfa-status--off">
            <ShieldOff size={14} /> Inactivo
          </span>
        {/if}
      </header>

      {#if mfaLoading}
        <p class="section-help">Cargando estado…</p>
      {:else if mfaError}
        <p class="section-help section-help--err">{mfaError}</p>
      {:else if mfaStatus}
        {#if mfaStatus.remaining < 5}
          <div class="warn">
            <AlertTriangle size={16} aria-hidden="true" />
            <span>
              Te quedan <strong>{mfaStatus.remaining}</strong> códigos de recuperación.
              Considera regenerarlos para no quedarte sin acceso.
            </span>
          </div>
        {/if}
        <div class="mfa-actions">
          <Button variant="secondary" onclick={openRegen}>
            <RefreshCw size={14} /> Regenerar códigos
          </Button>
          <Button variant="danger" onclick={openDisable}>
            <ShieldOff size={14} /> Desactivar MFA
          </Button>
        </div>
        <p class="section-help">
          Los códigos vigentes solo se muestran al regenerarlos. Guárdalos en un lugar seguro.
        </p>
      {:else}
        <p class="section-help">
          Aún no has activado MFA. Al iniciar sesión con esta cuenta se te pedirá configurarlo en el
          siguiente inicio de sesión.
        </p>
      {/if}
    </section>
  {/if}
</div>

<Modal
  open={showChangePwd}
  title="Cambiar contraseña"
  description="Introduce tu contraseña actual y la nueva."
  size="sm"
  onClose={() => (showChangePwd = false)}
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
    <Button variant="ghost" onclick={() => (showChangePwd = false)}>Cancelar</Button>
    <Button onclick={submitChangePwd} loading={savingPwd}>Guardar</Button>
  {/snippet}
</Modal>

<Modal
  open={showDisable}
  title="Desactivar segundo factor"
  description="Confirma con tu contraseña y un código reciente."
  size="sm"
  onClose={() => (showDisable = false)}
>
  <div class="form-stack">
    <Field
      label="Contraseña"
      type="password"
      autocomplete="current-password"
      bind:value={disablePwd}
      required
    />
    <OtpInput label="Código de verificación" bind:value={disableCode} length={6} />
    {#if disableError}
      <p class="form-error" role="alert">{disableError}</p>
    {/if}
  </div>
  {#snippet footer()}
    <Button variant="ghost" onclick={() => (showDisable = false)}>Cancelar</Button>
    <Button variant="danger" onclick={submitDisable} loading={disabling}>Desactivar</Button>
  {/snippet}
</Modal>

<Modal
  open={showRegen}
  title="Regenerar códigos de recuperación"
  description="Confirma con un código de tu app autenticadora."
  size="md"
  onClose={closeRegen}
>
  {#if !regenResult}
    <div class="form-stack">
      <OtpInput label="Código de verificación" bind:value={regenCode} length={6} />
      {#if regenError}
        <p class="form-error" role="alert">{regenError}</p>
      {/if}
    </div>
  {:else}
    <CodeBlock items={regenResult.recoveryCodes} />
    <p class="section-help">
      Estos códigos sustituyen a los anteriores. Guárdalos antes de cerrar.
    </p>
  {/if}
  {#snippet footer()}
    <Button variant="ghost" onclick={closeRegen}>
      {regenResult ? 'Ya los guardé' : 'Cancelar'}
    </Button>
    {#if !regenResult}
      <Button onclick={submitRegen} loading={regenerating}>Regenerar</Button>
    {/if}
  {/snippet}
</Modal>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .page {
    padding: $space-7 $space-5 $space-9;
    max-width: 720px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: $space-7;

    @media (min-width: #{$bp-md}) {
      padding: $space-9 $space-7;
    }
  }

  .card {
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    padding: $space-6;
    display: flex;
    flex-direction: column;
    gap: $space-5;
  }

  .card__head {
    display: flex;
    align-items: center;
    gap: $space-4;
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
    padding-top: $space-4;
    border-top: 1px solid $border;
    display: flex;
    justify-content: flex-end;
  }

  .section-head {
    display: flex;
    flex-direction: column;
    gap: $space-3;

    @media (min-width: #{$bp-sm}) {
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
    }
  }

  .section-title {
    font-family: $font-display;
    font-size: $fs-lg;
    font-weight: $fw-semibold;
    color: $text;
  }

  .section-desc {
    margin-top: 4px;
    font-size: $fs-sm;
    color: $muted;
    line-height: $lh-relaxed;
    max-width: 56ch;
  }

  .section-help {
    font-size: $fs-sm;
    color: $muted;
    line-height: $lh-relaxed;
  }

  .section-help--err {
    color: $danger;
  }

  .mfa-status {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    font-size: $fs-xs;
    font-weight: $fw-medium;
    padding: 4px 10px;
    border-radius: $radius-pill;
    border: 1px solid transparent;
    text-transform: uppercase;
    letter-spacing: $ls-wide;
  }

  .mfa-status--on {
    background: rgba(94, 159, 122, 0.1);
    color: color.adjust($success, $lightness: -8%);
    border-color: rgba(94, 159, 122, 0.22);
  }

  .mfa-status--off {
    background: $ivory;
    color: $muted;
    border-color: $border;
  }

  .mfa-actions {
    display: flex;
    flex-wrap: wrap;
    gap: $space-3;
  }

  .warn {
    display: flex;
    align-items: flex-start;
    gap: $space-3;
    padding: $space-3 $space-4;
    border: 1px solid rgba(232, 124, 104, 0.3);
    background: rgba(232, 124, 104, 0.06);
    border-radius: $radius-md;
    color: color.adjust($coral, $lightness: -10%);
    font-size: $fs-sm;
    line-height: $lh-relaxed;

    strong {
      font-weight: $fw-semibold;
    }
  }

  .form-stack {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  .form-error {
    font-size: $fs-sm;
    color: $danger;
  }
</style>