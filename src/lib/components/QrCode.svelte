<script lang="ts">
  interface Props {
    data: string; // texto a codificar (otpauth URI)
    size?: number;
    label?: string;
  }

  let { data, size = 220, label = 'Código QR' }: Props = $props();

  let dataUrl = $state<string | null>(null);
  let error = $state<string | null>(null);

  $effect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await import('qrcode');
        const url = await mod.toDataURL(data, {
          width: size,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
          errorCorrectionLevel: 'H'
        });
        if (!cancelled) {
          dataUrl = url;
          error = null;
        }
      } catch (e) {
        if (!cancelled) {
          error = 'No se pudo generar el código QR.';
          dataUrl = null;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  });
</script>

<div class="qr">
  {#if error}
    <p class="qr__error">{error}</p>
    <p class="qr__fallback">Abre este enlace en tu app autenticadora:</p>
    <code class="qr__uri">{data}</code>
  {:else if dataUrl}
    <img src={dataUrl} alt={label} width={size} height={size} />
  {:else}
    <div class="qr__placeholder" style="width: {size}px; height: {size}px" aria-hidden="true"></div>
  {/if}
</div>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .qr {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-2;
  }

  .qr img {
    border-radius: $radius-md;
    background: $white;
    border: 1px solid $border;
    padding: $space-2;
  }

  .qr__placeholder {
    background: $ivory;
    border: 1px solid $border;
    border-radius: $radius-md;
  }

  .qr__error {
    color: $danger;
    font-size: $fs-sm;
  }

  .qr__fallback {
    color: $muted;
    font-size: $fs-sm;
  }

  .qr__uri {
    font-size: $fs-xs;
    color: $text;
    background: $ivory;
    padding: $space-2 $space-3;
    border-radius: $radius-sm;
    word-break: break-all;
    text-align: center;
    max-width: 320px;
  }
</style>
