<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    label?: string;
    name?: string;
    value?: string;
    placeholder?: string;
    error?: string | null;
    helper?: string;
    required?: boolean;
    disabled?: boolean;
    rows?: number;
    id?: string;
    maxlength?: number;
  }

  let {
    label,
    name,
    value = $bindable(''),
    placeholder,
    error = null,
    helper,
    required = false,
    disabled = false,
    rows = 4,
    id,
    maxlength
  }: Props = $props();

  const fieldId = $derived(id ?? `textarea-${Math.random().toString(36).slice(2, 8)}`);
</script>

<div class="field" class:has-error={!!error}>
  {#if label}
    <label class="field__label" for={fieldId}>
      {label}
      {#if required}<span class="field__required" aria-hidden="true">*</span>{/if}
    </label>
  {/if}
  <textarea
    id={fieldId}
    {name}
    {placeholder}
    {disabled}
    {required}
    {rows}
    {maxlength}
    bind:value
    aria-invalid={!!error}
    aria-describedby={error ? `${fieldId}-err` : helper ? `${fieldId}-help` : undefined}
    class="field__input"
  ></textarea>
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
    padding: $space-3 $space-4;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-md;
    font-family: inherit;
    font-size: $fs-base;
    color: $text;
    line-height: $lh-relaxed;
    resize: vertical;
    min-height: 96px;
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
