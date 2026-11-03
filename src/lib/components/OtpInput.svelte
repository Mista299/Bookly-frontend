<script lang="ts">
  interface Props {
    label?: string;
    value?: string;
    error?: string | null;
    length?: number;
    helper?: string;
    disabled?: boolean;
    onComplete?: (code: string) => void;
  }

  let {
    label,
    value = $bindable(''),
    error = null,
    length = 6,
    helper,
    disabled = false,
    onComplete
  }: Props = $props();

  const chars = $derived.by(() => {
    const padded = (value ?? '').padEnd(length, ' ').slice(0, length).split('');
    return padded;
  });

  function setChar(i: number, ch: string) {
    const v = (value ?? '').padEnd(length, ' ').split('');
    v[i] = ch;
    const next = v.join('').trimEnd();
    value = next;
    if (next.replace(/\s/g, '').length === length) {
      onComplete?.(next);
    }
  }

  function onInput(e: Event, i: number) {
    const el = e.target as HTMLInputElement;
    const ch = el.value.replace(/\D/g, '').slice(-1);
    setChar(i, ch);
  }

  function onKeyDown(e: KeyboardEvent, i: number) {
    const target = e.target as HTMLInputElement;
    if (e.key === 'Backspace' && !target.value && i > 0) {
      const prev = target.parentElement?.querySelectorAll<HTMLInputElement>('.otp__char')[i - 1];
      prev?.focus();
    } else if (e.key === 'ArrowLeft' && i > 0) {
      const prev = target.parentElement?.querySelectorAll<HTMLInputElement>('.otp__char')[i - 1];
      prev?.focus();
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      const next = target.parentElement?.querySelectorAll<HTMLInputElement>('.otp__char')[i + 1];
      next?.focus();
    } else if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      setChar(i, e.key);
      if (i < length - 1) {
        const n = target.parentElement?.querySelectorAll<HTMLInputElement>('.otp__char')[i + 1];
        n?.focus();
      }
    }
  }

  function onPaste(e: ClipboardEvent, i: number) {
    e.preventDefault();
    const data = (e.clipboardData?.getData('text') ?? '').replace(/\D/g, '');
    if (!data) return;
    const v = (value ?? '').padEnd(length, ' ').split('');
    for (let k = 0; k < data.length && i + k < length; k++) {
      v[i + k] = data[k];
    }
    value = v.join('').trimEnd();
    if (value.replace(/\s/g, '').length === length) {
      onComplete?.(value);
    }
  }
</script>

<div class="otp" class:has-error={!!error}>
  {#if label}
    <p class="otp__label">{label}</p>
  {/if}
  <div class="otp__row" role="group" aria-label="Código de verificación">
    {#each chars as ch, i (i)}
      <input
        class="otp__char"
        inputmode="numeric"
        pattern="[0-9]*"
        maxlength="1"
        autocomplete="one-time-code"
        aria-label="Dígito {i + 1}"
        value={ch.trim()}
        {disabled}
        oninput={(e) => onInput(e, i)}
        onkeydown={(e) => onKeyDown(e, i)}
        onpaste={(e) => onPaste(e, i)}
      />
    {/each}
  </div>
  {#if error}<p class="otp__error">{error}</p>
  {:else if helper}<p class="otp__helper">{helper}</p>{/if}
</div>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .otp {
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }

  .otp__label {
    font-size: $fs-sm;
    font-weight: $fw-medium;
    color: $text;
  }

  .otp__row {
    display: flex;
    gap: $space-2;
    justify-content: center;
  }

  .otp__char {
    width: 44px;
    height: 56px;
    text-align: center;
    font-family: $font-display;
    font-size: $fs-2xl;
    font-weight: $fw-semibold;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-md;
    color: $text;
    transition:
      border-color var(--dur-fast) var(--ease-out),
      box-shadow var(--dur-fast) var(--ease-out);

    &:focus-visible {
      outline: none;
      border-color: $plum;
      box-shadow: 0 0 0 3px rgba(56, 44, 70, 0.14);
    }

    &:disabled {
      background: $ivory;
      color: $muted;
      cursor: not-allowed;
    }
  }

  .has-error .otp__char {
    border-color: $danger;

    &:focus-visible {
      box-shadow: 0 0 0 3px rgba($danger, 0.18);
    }
  }

  .otp__error {
    font-size: $fs-xs;
    color: $danger;
    text-align: center;
  }

  .otp__helper {
    font-size: $fs-xs;
    color: $muted;
    text-align: center;
  }
</style>
