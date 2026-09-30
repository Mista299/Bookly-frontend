<script lang="ts">
  import Field from '$lib/components/Field.svelte';
  import Button from '$lib/components/Button.svelte';
  import { auth } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { toasts } from '$lib/stores/toasts';

  let email = $state('');
  let password = $state('');
  let emailError = $state<string | null>(null);
  let passwordError = $state<string | null>(null);
  let submitting = $state(false);

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault();
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
      const user = await auth.login(trimmed, password);
      const target =
        user.role === 'ADMIN'
          ? '/admin'
          : user.role === 'PROFESSIONAL'
            ? '/professional'
            : '/customer';
      toasts.push('Sesión iniciada.', 'success');
      await goto(target);
    } catch (err) {
      const e = err as { message?: string; errorCode?: string; status?: number; details?: Record<string, string> };
      if (e.details?.email) emailError = e.details.email;
      if (e.details?.password) passwordError = e.details.password;
      const msg =
        e.message ??
        (e.status === 401 || e.errorCode === 'ACCOUNT_LOCKED'
          ? 'Credenciales inválidas o cuenta bloqueada temporalmente.'
          : 'No pudimos iniciar sesión.');
      toasts.push(msg, 'danger');
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
    <h1 class="card__title">Bienvenida de nuevo.</h1>
    <p class="card__lede">Inicia sesión para administrar servicios y profesionales.</p>
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
    <div class="form__actions">
      <Button type="submit" size="lg" loading={submitting}>Entrar</Button>
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
</style>