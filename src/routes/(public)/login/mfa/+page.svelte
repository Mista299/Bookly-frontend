<script lang="ts">
  import OtpInput from '$lib/components/OtpInput.svelte';
  import Switch from '$lib/components/Switch.svelte';
  import Button from '$lib/components/Button.svelte';
  import { page } from '$app/stores';
  import { auth } from '$lib/stores/auth';
  import { formatApiError, isApiError } from '$lib/services/errors';
  import { toasts } from '$lib/stores/toasts';
  import { goto } from '$app/navigation';

  const mfaToken = $derived($page.url.searchParams.get('token') ?? '');

  let code = $state('');
  let submitting = $state(false);
  let codeError = $state<string | null>(null);
  let trustDevice = $state(false);
  let lockedUntil = $state<number | null>(null);

  function startCountdown(endAt: number) {
    lockedUntil = endAt;
    const tick = () => {
      if (!lockedUntil) return;
      const remaining = Math.max(0, lockedUntil - Date.now());
      if (remaining <= 0) {
        lockedUntil = null;
      } else {
        setTimeout(tick, 1000);
      }
    };
    tick();
  }

  function fmtCountdown(): string {
    if (!lockedUntil) return '';
    const remaining = Math.max(0, lockedUntil - Date.now());
    const m = Math.floor(remaining / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  async function submitCode(next: string) {
    if (submitting) return;
    if (!mfaToken) {
      codeError = 'Sesión inválida. Vuelve a iniciar sesión.';
      return;
    }
    submitting = true;
    codeError = null;
    try {
      const outcome = await auth.verifyMfa(mfaToken, next, trustDevice);
      if (outcome.kind === 'authenticated') {
        toasts.push('Sesión iniciada.', 'success');
        const target =
          outcome.user.role === 'ADMIN'
            ? '/admin'
            : outcome.user.role === 'PROFESSIONAL'
              ? '/professional'
              : '/customer';
        await goto(target);
        return;
      }
      if (outcome.kind === 'locked') {
        const minutes = outcome.lockMinutes || 15;
        startCountdown(Date.now() + minutes * 60_000);
        toasts.push(`Cuenta bloqueada. Intenta en ${minutes} minutos.`, 'warning');
        code = '';
        return;
      }
      if (outcome.kind !== 'error') {
        code = '';
        toasts.push('No se pudo verificar el código.', 'danger');
        return;
      }
      const err = outcome.error;
      code = '';
      codeError = formatApiError(err, 'Código inválido.');
      if (isApiError(err) && err.errorCode === 'MFA_CODE_INVALID') {
        codeError = 'El código no es válido. Inténtalo de nuevo.';
      }
      if (isApiError(err) && err.errorCode === 'ACCOUNT_LOCKED') {
        startCountdown(Date.now() + (err.lockMinutes ?? 15) * 60_000);
      }
      toasts.push(codeError, 'danger');
    } finally {
      submitting = false;
    }
  }

  function onComplete(next: string) {
    void submitCode(next);
  }

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (code.replace(/\s/g, '').length === 6) {
      await submitCode(code);
    } else {
      codeError = 'Introduce los 6 dígitos del código.';
    }
  }

  function cancel() {
    void goto('/login');
  }
</script>

<svelte:head>
  <title>Verificación en dos pasos · BOOKLY</title>
</svelte:head>

<div class="card">
  <header class="card__head">
    <p class="eyebrow">Segundo factor</p>
    <h1 class="card__title">Confirma tu identidad.</h1>
    <p class="card__lede">
      Introduce el código de 6 dígitos que muestra tu aplicación autenticadora.
    </p>
  </header>

  <form class="form" onsubmit={onSubmit} novalidate>
    <OtpInput
      label="Código de verificación"
      bind:value={code}
      error={codeError}
      helper={lockedUntil && lockedUntil > Date.now() ? '' : 'Pega o escribe el código.'}
      disabled={submitting || (!!lockedUntil && lockedUntil > Date.now())}
      onComplete={onComplete}
    />

    {#if lockedUntil && lockedUntil > Date.now()}
      <div class="lock" role="status">
        <span class="lock__dot" aria-hidden="true"></span>
        <p class="lock__msg">
          Demasiados intentos. Vuelve a probar en
          <strong>{fmtCountdown()}</strong>.
        </p>
      </div>
    {/if}

    <div class="trust-row">
      <Switch label="Confiar en este dispositivo" bind:checked={trustDevice} />
    </div>

    <div class="form__actions">
      <Button variant="ghost" type="button" onclick={cancel}>Cancelar</Button>
      <Button
        type="submit"
        size="lg"
        loading={submitting}
        disabled={(!!lockedUntil && lockedUntil > Date.now()) ||
          code.replace(/\s/g, '').length !== 6}
      >
        Verificar
      </Button>
    </div>
  </form>
</div>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .card {
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-lg;
    padding: $space-8 $space-6;
    box-shadow: $shadow-1;

    @media (min-width: #{$bp-md}) {
      padding: $space-10 $space-8;
    }
  }

  .card__head {
    margin-bottom: $space-7;
  }

  .card__title {
    font-family: $font-display;
    font-size: $fs-3xl;
    font-weight: $fw-semibold;
    letter-spacing: $ls-display;
    line-height: $lh-tight;
    margin: $space-3 0 $space-3;
  }

  .card__lede {
    font-size: $fs-md;
    color: $muted;
    line-height: $lh-relaxed;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: $space-5;
  }

  .form__actions {
    display: flex;
    justify-content: flex-end;
    gap: $space-3;
    flex-wrap: wrap;
    margin-top: $space-3;

    :global(.btn) {
      flex: 1;
      min-width: 140px;
    }
  }

  .trust-row {
    display: flex;
    justify-content: center;
    margin-top: $space-2;
  }

  .lock {
    display: flex;
    align-items: center;
    gap: $space-3;
    padding: $space-3 $space-4;
    background: rgba(232, 124, 104, 0.08);
    border: 1px solid rgba(232, 124, 104, 0.25);
    border-radius: $radius-md;

    strong {
      font-family: $font-display;
      font-variant-numeric: tabular-nums;
      margin-left: 4px;
    }
  }

  .lock__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: $coral;
    flex-shrink: 0;
  }

  .lock__msg {
    font-size: $fs-sm;
    color: $text;
    line-height: $lh-snug;
  }
</style>