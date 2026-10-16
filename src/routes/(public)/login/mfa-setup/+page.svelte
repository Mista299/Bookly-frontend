<script lang="ts">
  import OtpInput from '$lib/components/OtpInput.svelte';
  import QrCode from '$lib/components/QrCode.svelte';
  import CodeBlock from '$lib/components/CodeBlock.svelte';
  import Button from '$lib/components/Button.svelte';
  import { page } from '$app/stores';
  import { auth } from '$lib/stores/auth';
  import { formatApiError, isApiError } from '$lib/services/errors';
  import { toasts } from '$lib/stores/toasts';
  import { goto } from '$app/navigation';
  import { Copy, Check } from 'lucide-svelte';

  const mfaToken = $derived($page.url.searchParams.get('token') ?? '');

  type Stage = 'loading' | 'enroll' | 'recovery' | 'done';
  let stage = $state<Stage>('loading');
  let secret = $state('');
  let otpauthUri = $state('');
  let recoveryCodes = $state<string[]>([]);
  let userRole = $state<'ADMIN' | 'PROFESSIONAL' | 'CUSTOMER'>('ADMIN');

  let code = $state('');
  let codeError = $state<string | null>(null);
  let submitting = $state(false);
  let secretCopied = $state(false);

  $effect(() => {
    if (!mfaToken) {
      toasts.push('Sesión inválida. Vuelve a iniciar sesión.', 'warning');
      void goto('/login');
      return;
    }
    if (stage !== 'loading') return;
    let cancelled = false;
    (async () => {
      try {
        const res = await auth.enrollMfa(mfaToken);
        if (cancelled) return;
        secret = res.secret;
        otpauthUri = res.otpauthUri;
        stage = 'enroll';
      } catch (err) {
        if (cancelled) return;
        toasts.push(formatApiError(err, 'No se pudo iniciar la configuración.'), 'danger');
        void goto('/login');
      }
    })();
    return () => {
      cancelled = true;
    };
  });

  async function copySecret() {
    try {
      await navigator.clipboard.writeText(secret);
      secretCopied = true;
      setTimeout(() => (secretCopied = false), 1500);
    } catch {
      secretCopied = false;
    }
  }

  async function confirmCode(next: string) {
    if (submitting) return;
    submitting = true;
    codeError = null;
    try {
      const res = await auth.confirmMfaEnrollment(mfaToken, next, false);
      recoveryCodes = res.recoveryCodes;
      userRole = res.user?.role ?? 'ADMIN';
      stage = 'recovery';
    } catch (err) {
      const apiErr = isApiError(err) ? err : null;
      code = '';
      codeError =
        apiErr?.errorCode === 'MFA_CODE_INVALID'
          ? 'El código no es válido. Inténtalo de nuevo.'
          : formatApiError(err, 'No se pudo confirmar el código.');
      toasts.push(codeError, 'danger');
    } finally {
      submitting = false;
    }
  }

  function onComplete(next: string) {
    void confirmCode(next);
  }

  function finish() {
    toasts.push('Segundo factor activado.', 'success');
    const target =
      userRole === 'ADMIN'
        ? '/admin'
        : userRole === 'PROFESSIONAL'
          ? '/professional'
          : '/customer';
    void goto(target);
  }
</script>

<svelte:head>
  <title>Activar segundo factor · BOOKLY</title>
</svelte:head>

<div class="card">
  {#if stage === 'loading'}
    <header class="card__head">
      <p class="eyebrow">Segundo factor</p>
      <h1 class="card__title">Preparando tu autenticador…</h1>
      <p class="card__lede">Estamos generando tu código QR.</p>
    </header>
    <div class="loading" aria-busy="true">
      <div class="loading__pulse" aria-hidden="true"></div>
    </div>
  {:else if stage === 'enroll'}
    <header class="card__head">
      <p class="eyebrow">Segundo factor</p>
      <h1 class="card__title">Configura tu segundo factor.</h1>
      <p class="card__lede">
        Escanea el código con tu aplicación autenticadora (Google Authenticator, 1Password, Authy)
        y luego escribe los 6 dígitos que aparecen.
      </p>
    </header>

    <div class="setup">
      <div class="qr-wrap">
        <QrCode data={otpauthUri} size={280} label="Código QR para tu autenticador" />
      </div>

      <div class="secret">
        <p class="secret__label">Si no puedes escanear, ingresa este código manualmente en tu app:</p>
        <div class="secret__row">
          <code class="secret__code" aria-label="Secreto compartido">{secret}</code>
          <button
            type="button"
            class="secret__copy"
            onclick={copySecret}
            aria-label="Copiar secreto"
          >
            {#if secretCopied}<Check size={14} />{:else}<Copy size={14} />{/if}
          </button>
        </div>
        <p class="secret__hint">
          Tipo: <strong>TOTP</strong> · Dígitos: <strong>6</strong> · Periodo: <strong>30s</strong> · Algoritmo: <strong>SHA-1</strong>
        </p>
      </div>

      <details class="alt">
        <summary>O usar el enlace completo</summary>
        <div class="alt__row">
          <code class="alt__uri">{otpauthUri}</code>
          <button
            type="button"
            class="alt__copy"
            onclick={async () => {
              try {
                await navigator.clipboard.writeText(otpauthUri);
                toasts.push('Enlace copiado. Pégalo en el navegador de tu móvil.', 'success', 4500);
              } catch {
                toasts.push('No se pudo copiar.', 'danger');
              }
            }}
          >
            <Copy size={14} /> Copiar
          </button>
        </div>
        <p class="alt__hint">Algunas apps detectan este enlace al pegarlo en el navegador del móvil.</p>
      </details>

      <div class="confirm">
        <OtpInput
          label="Código de verificación"
          bind:value={code}
          error={codeError}
          helper="Los 6 dígitos que ves en tu app autenticadora."
          disabled={submitting}
          onComplete={onComplete}
        />
      </div>
    </div>
  {:else if stage === 'recovery'}
    <header class="card__head">
      <p class="eyebrow">Último paso</p>
      <h1 class="card__title">Guarda tus códigos de recuperación.</h1>
      <p class="card__lede">
        Si pierdes acceso a tu segundo factor, estos códigos te permitirán volver a entrar. Guárdalos
        en un lugar seguro y no los compartas.
      </p>
    </header>

    <div class="recovery">
      <CodeBlock items={recoveryCodes} />
      <div class="recovery__actions">
        <Button variant="ghost" onclick={() => toasts.push('Recomendamos guardarlos sin conexión.', 'info')}>
          Recordar después
        </Button>
        <Button onclick={finish}>Ya los guardé</Button>
      </div>
    </div>
  {/if}
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

  .loading {
    display: flex;
    justify-content: center;
    padding: $space-8 0;
  }

  .loading__pulse {
    width: 56px;
    height: 56px;
    border-radius: $radius-pill;
    background: $plum-soft;
    animation: pulse 1.4s ease-in-out infinite;
  }

  .setup {
    display: flex;
    flex-direction: column;
    gap: $space-6;
    align-items: center;
  }

  .qr-wrap {
    padding: $space-4;
    background: $white;
    border: 1px solid $border;
    border-radius: $radius-md;
  }

  .secret {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }

  .secret__label {
    font-size: $fs-sm;
    color: $muted;
    line-height: $lh-relaxed;
  }

  .secret__row {
    display: flex;
    align-items: center;
    gap: $space-2;
    padding: $space-3 $space-4;
    background: $ivory;
    border: 1px solid $border;
    border-radius: $radius-md;
  }

  .secret__code {
    flex: 1;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: $fs-sm;
    color: $text;
    word-break: break-all;
    letter-spacing: 0.04em;
  }

  .secret__copy {
    background: transparent;
    border: 1px solid $border;
    color: $muted;
    width: 36px;
    height: 36px;
    border-radius: $radius-sm;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &:hover {
      color: $plum;
      border-color: $plum-soft;
    }
  }

  .confirm {
    width: 100%;
  }

  .secret__hint {
    font-size: $fs-xs;
    color: $muted;
  }

  .alt {
    width: 100%;
    background: $ivory;
    border: 1px solid $border;
    border-radius: $radius-md;
    padding: $space-3 $space-4;
  }

  .alt summary {
    cursor: pointer;
    font-size: $fs-sm;
    color: $plum;
    font-weight: $fw-medium;
  }

  .alt__row {
    display: flex;
    align-items: center;
    gap: $space-2;
    margin-top: $space-3;
    padding: $space-3;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-sm;
  }

  .alt__uri {
    flex: 1;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: $fs-xs;
    color: $text;
    word-break: break-all;
  }

  .alt__copy {
    background: $plum-soft;
    border: 0;
    color: $plum;
    padding: 6px 10px;
    border-radius: $radius-sm;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: $fs-xs;
    font-weight: $fw-medium;
    cursor: pointer;
    flex-shrink: 0;
  }

  .alt__hint {
    font-size: $fs-xs;
    color: $muted;
    margin-top: $space-2;
  }

  .recovery {
    display: flex;
    flex-direction: column;
    gap: $space-5;
  }

  .recovery__actions {
    display: flex;
    justify-content: flex-end;
    gap: $space-3;
    flex-wrap: wrap;

    :global(.btn) {
      flex: 1;
      min-width: 140px;
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 0.55;
      transform: scale(1);
    }
    50% {
      opacity: 0.9;
      transform: scale(1.05);
    }
  }
</style>