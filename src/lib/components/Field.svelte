<script lang="ts">
  interface Props {
    label?: string;
    value?: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
    placeholder?: string;
    error?: string | null;
    helper?: string;
    required?: boolean;
    disabled?: boolean;
    autocomplete?: string;
    id?: string;
    name?: string;
    min?: number;
    max?: number;
    step?: number;
  }

  let {
    label,
    value = $bindable(''),
    type = 'text',
    placeholder,
    error = null,
    helper,
    required = false,
    disabled = false,
    autocomplete,
    id,
    name,
    min,
    max,
    step
  }: Props = $props();

  const fieldId = $derived(id ?? `field-${Math.random().toString(36).slice(2, 8)}`);
</script>

<div class="field" class:has-error={!!error}>
  {#if label}
    <label class="field__label" for={fieldId}>
      {label}
      {#if required}<span class="field__required" aria-hidden="true">*</span>{/if}
    </label>
  {/if}
  <input
    id={fieldId}
    {name}
    {type}
    {placeholder}
    {disabled}
    {required}
    {autocomplete}
    {min}
    {max}
    {step}
    bind:value
    aria-invalid={!!error}
    aria-describedby={error ? `${fieldId}-err` : helper ? `${fieldId}-help` : undefined}
    class="field__input"
  />
  {#if error}
    <p id="{fieldId}-err" class="field__error">{error}</p>
  {:else if helper}
    <p id="{fieldId}-help" class="field__helper">{helper}</p>
  {/if}
</div>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .field {
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }

  .field__label {
    font-size: $fs-sm;
    font-weight: $fw-medium;
    color: $text;
  }

  .field__required {
    color: $coral;
    margin-left: 2px;
  }

  .field__input {
    width: 100%;
    min-height: var(--touch-target);
    padding: 0 $space-4;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-md;
    font-size: $fs-base;
    color: $text;
    transition:
      border-color var(--dur-fast) var(--ease-out),
      box-shadow var(--dur-fast) var(--ease-out);

    &::placeholder {
      color: color.adjust($muted, $lightness: 12%);
    }

    &:hover:not(:disabled) {
      border-color: color.adjust($border, $lightness: -8%);
    }

    &:focus-visible {
      outline: none;
      border-color: $plum;
      box-shadow: 0 0 0 3px rgba(56, 44, 70, 0.12);
    }

    &:disabled {
      background: $ivory;
      color: $muted;
      cursor: not-allowed;
    }
  }

  .has-error .field__input {
    border-color: $danger;

    &:focus-visible {
      box-shadow: 0 0 0 3px rgba(217, 107, 104, 0.18);
    }
  }

  .field__error {
    font-size: $fs-xs;
    color: $danger;
  }

  .field__helper {
    font-size: $fs-xs;
    color: $muted;
  }
</style>