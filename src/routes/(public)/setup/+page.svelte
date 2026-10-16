<script lang="ts">
  import Field from '$lib/components/Field.svelte';
  import Button from '$lib/components/Button.svelte';
  import { platformService } from '$lib/services/platform';
  import { formatApiError, isApiError } from '$lib/services/errors';
  import { toasts } from '$lib/stores/toasts';
  import { goto } from '$app/navigation';

  let platformName = $state('');
  let adminEmail = $state('');
  let adminFullName = $state('');
  let adminPassword = $state('');
  let adminPasswordConfirm = $state('');
  let submitting = $state(false);
  let errors = $state<Record<string, string>>({});

  const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!platformName.trim()) e.platformName = 'El nombre de la plataforma es obligatorio.';
    if (!adminFullName.trim()) e.adminFullName = 'El nombre es obligatorio.';
    if (!EMAIL_RE.test(adminEmail.trim())) e.adminEmail = 'Introduce un correo válido.';
    if (!PASSWORD_RE.test(adminPassword))
      e.adminPassword =
        'Debe tener 8+ caracteres, mayúscula, minúscula, número y un carácter especial.';
    if (adminPassword !== adminPasswordConfirm)
      e.adminPasswordConfirm = 'Las contraseñas no coinciden.';
    errors = e;
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!validate()) return;
    submitting = true;
    try {
      await platformService.setup({
        name: platformName.trim(),
        adminEmail: adminEmail.trim(),
        adminPassword,
        adminFullName: adminFullName.trim()
      });
      toasts.push('Plataforma configurada.', 'success');
      await goto('/login');
    } catch (err) {
      const apiErr = err as Parameters<typeof formatApiError>[0];
      if (isApiError(apiErr) && apiErr.errorCode === 'PLATFORM_ALREADY_CONFIGURED') {
        toasts.push('La plataforma ya fue configurada. Inicia sesión.', 'info');
        await goto('/login');
        return;
      }
      const detailErr = err as { details?: Record<string, string> };
      if (detailErr.details) errors = { ...errors, ...detailErr.details };
      toasts.push(formatApiError(err, 'No se pudo configurar la plataforma.'), 'danger');
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Configurar plataforma · BOOKLY</title>
</svelte:head>

<div class="card">
  <header class="card__head">
    <p class="eyebrow">Primer arranque</p>
    <h1 class="card__title">Configura tu plataforma.</h1>
    <p class="card__lede">
      Crea el nombre del negocio y la cuenta administradora. Después podrás iniciar sesión con ese
      correo.
    </p>
  </header>

  <form class="form" onsubmit={onSubmit} novalidate>
    <Field
      label="Nombre de la plataforma"
      bind:value={platformName}
      error={errors.platformName ?? null}
      placeholder="Estudio Aura"
      autocomplete="organization"
      required
    />

    <Field
      label="Nombre del administrador"
      bind:value={adminFullName}
      error={errors.adminFullName ?? null}
      placeholder="Nombre y apellido"
      autocomplete="name"
      required
    />

    <Field
      label="Correo del administrador"
      type="email"
      bind:value={adminEmail}
      error={errors.adminEmail ?? null}
      placeholder="admin@bookly.com"
      autocomplete="email"
      required
    />

    <Field
      label="Contraseña"
      type="password"
      bind:value={adminPassword}
      error={errors.adminPassword ?? null}
      placeholder="Mínimo 8 caracteres"
      helper="8+ caracteres, mayúscula, minúscula, número y carácter especial."
      autocomplete="new-password"
      required
    />

    <Field
      label="Repetir contraseña"
      type="password"
      bind:value={adminPasswordConfirm}
      error={errors.adminPasswordConfirm ?? null}
      placeholder="Confirma la contraseña"
      autocomplete="new-password"
      required
    />

    <div class="form__actions">
      <Button type="submit" size="lg" loading={submitting}>Configurar plataforma</Button>
    </div>

    <div class="form__footer">
      <a class="form__link" href="/login">¿Ya configuraste? Inicia sesión</a>
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