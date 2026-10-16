<script lang="ts">
  import Field from '$lib/components/Field.svelte';
  import Button from '$lib/components/Button.svelte';
  import { auth } from '$lib/stores/auth';
  import { formatApiError, isApiError } from '$lib/services/errors';
  import { toasts } from '$lib/stores/toasts';
  import { goto } from '$app/navigation';

  let fullName = $state('');
  let email = $state('');
  let password = $state('');
  let submitting = $state(false);
  let errors = $state<Record<string, string>>({});

  const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'El nombre es obligatorio.';
    if (!EMAIL_RE.test(email.trim())) e.email = 'Introduce un correo válido.';
    if (!PASSWORD_RE.test(password))
      e.password =
        'Debe tener 8+ caracteres, mayúscula, minúscula, número y un carácter especial.';
    errors = e;
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!validate()) return;
    submitting = true;
    try {
      await auth.register({
        fullName: fullName.trim(),
        email: email.trim(),
        password
      });
      toasts.push('Cuenta creada. Inicia sesión.', 'success');
      await goto('/login');
    } catch (err) {
      const apiErr = err as Parameters<typeof formatApiError>[0];
      if (isApiError(apiErr) && apiErr.errorCode === 'EMAIL_ALREADY_REGISTERED') {
        errors = { ...errors, email: 'Este correo ya está registrado.' };
        toasts.push(formatApiError(apiErr), 'danger');
        return;
      }
      const detailErr = err as { details?: Record<string, string> };
      if (detailErr.details) errors = { ...errors, ...detailErr.details };
      toasts.push(formatApiError(err, 'No pudimos crear tu cuenta.'), 'danger');
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Crear cuenta · BOOKLY</title>
</svelte:head>

<div class="card">
  <header class="card__head">
    <p class="eyebrow">Nuevo cliente</p>
    <h1 class="card__title">Crea tu cuenta.</h1>
    <p class="card__lede">
      Reserva tus servicios y consulta tu agenda desde un solo lugar.
    </p>
  </header>

  <form class="form" onsubmit={onSubmit} novalidate>
    <Field
      label="Nombre completo"
      bind:value={fullName}
      error={errors.fullName ?? null}
      placeholder="Nombre y apellido"
      autocomplete="name"
      required
    />

    <Field
      label="Correo electrónico"
      type="email"
      bind:value={email}
      error={errors.email ?? null}
      placeholder="tu@correo.com"
      autocomplete="email"
      required
    />

    <Field
      label="Contraseña"
      type="password"
      bind:value={password}
      error={errors.password ?? null}
      placeholder="Crea una contraseña"
      helper="8+ caracteres, mayúscula, minúscula, número y carácter especial."
      autocomplete="new-password"
      required
    />

    <div class="form__actions">
      <Button type="submit" size="lg" loading={submitting}>Crear cuenta</Button>
    </div>

    <div class="form__footer">
      <a class="form__link" href="/login">¿Ya tienes cuenta? Iniciar sesión</a>
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
    justify-content: center;
    margin-top: $space-3;
  }

  .form__link {
    color: $plum;
    font-size: $fs-sm;
    font-weight: $fw-medium;
    text-decoration: underline;
  }
</style>