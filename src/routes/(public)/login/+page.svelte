<script lang="ts">
  import Field from '$lib/components/Field.svelte';
  import Button from '$lib/components/Button.svelte';
  import { auth } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { toasts } from '$lib/stores/toasts';
  import { formatApiError, isApiError } from '$lib/services/errors';

  let email = $state('');
  let password = $state('');
  let emailError = $state<string | null>(null);
  let passwordError = $state<string | null>(null);
  let submitting = $state(false);
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

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (lockedUntil && lockedUntil > Date.now()) return;
    emailError = null;
    passwordError = null;

    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      emailError = 'Introduce un correo válido.';
      return;
    }
    if (password.length < 8) {
      passwordError = 'La contraseña debe tener al menos 8 caracteres.';
      return;
    }

    submitting = true;
    try {
      const outcome = await auth.login(trimmed, password);
      if (outcome.kind === 'authenticated') {
        toasts.push('Sesión iniciada.', 'success');
        const target =
          outcome.user.role === 'ADMIN'
            ? '/admin'
            : outcome.user.role === 'PROFESSIONAL'
              ? '/professional'
              : '/customer';
        await goto(target);
      } else if (outcome.kind === 'mfaRequired') {
        await goto(`/login/mfa?token=${encodeURIComponent(outcome.mfaToken)}`);
      } else if (outcome.kind === 'mfaSetupRequired') {
        await goto(`/login/mfa-setup?token=${encodeURIComponent(outcome.mfaToken)}`);
      } else if (outcome.kind === 'locked') {
        const minutes = outcome.lockMinutes || 15;
        startCountdown(Date.now() + minutes * 60_000);
        toasts.push(`Cuenta bloqueada. Intenta en ${minutes} minutos.`, 'warning');
      } else {
        const err = outcome.error;
        if (err.details?.email) emailError = err.details.email;
        if (err.details?.password) passwordError = err.details.password;
        toasts.push(formatApiError(err, 'No pudimos iniciar sesión.'), 'danger');
        if (isApiError(err) && err.errorCode === 'ACCOUNT_LOCKED') {
          startCountdown(Date.now() + (err.lockMinutes ?? 15) * 60_000);
        }
      }
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Iniciar sesión · BOOKLY</title>
</svelte:head>

<div class="card">
  <header class="card__head">
    <p class="eyebrow">Acceso</p>
    <h1 class="card__title">Entra a tu cuenta.</h1>
    <p class="card__lede">
      Clientes, profesionales y administradores usan esta misma pantalla.
    </p>
  </header>

  <form class="form" onsubmit={onSubmit} novalidate>
    <Field
      label="Correo electrónico"
      type="email"
      placeholder="Copia y pega tu correo"
      bind:value={email}
      error={emailError}
      autocomplete="email"
      required
    />
    <Field
      label="Contraseña"
      type="password"
      placeholder="Tu contraseña"
      bind:value={password}
      error={passwordError}
      autocomplete="current-password"
      required
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

    <div class="form__actions">
      <Button type="submit" size="lg" loading={submitting} disabled={!!lockedUntil && lockedUntil > Date.now()}>
        Entrar
      </Button>
    </div>

    <div class="form__footer">
      <a class="form__link" href="/register">Crear cuenta de cliente</a>
      <a class="form__link form__link--muted" href="/setup">Configurar plataforma</a>
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
    margin-top: $space-3;

    :global(.btn) {
      width: 100%;
    }
  }

  .form__footer {
    display: flex;
    justify-content: space-between;
    gap: $space-3;
    flex-wrap: wrap;
    margin-top: $space-3;
  }

  .form__link {
    color: $plum;
    font-size: $fs-sm;
    font-weight: $fw-medium;
    text-decoration: underline;

    &--muted {
      color: $muted;
      text-decoration: none;

      &:hover { color: $plum; }
    }
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
