<script lang="ts">
  interface Props {
    label?: string;
    name?: string;
    value?: string; // yyyy-MM-ddTHH:mm
    type?: 'datetime-local' | 'date' | 'time';
    min?: string;
    max?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string | null;
    helper?: string;
    id?: string;
  }

  let {
    label,
    name,
    value = $bindable(''),
    type = 'datetime-local',
    min,
    max,
    required = false,
    disabled = false,
    error = null,
    helper,
    id
  }: Props = $props();

  const fieldId = $derived(id ?? `dti-${Math.random().toString(36).slice(2, 8)}`);
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
    {min}
    {max}
    {required}
    {disabled}
    bind:value
    aria-invalid={!!error}
    class="field__input"
  />
  {#if error}<p class="field__error">{error}</p>
  {:else if helper}<p class="field__helper">{helper}</p>{/if}
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
    // $coral no alcanza el contraste AA como texto (2.79:1 sobre blanco).
    color: $danger;
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
    color-scheme: light;
    transition:
      border-color var(--dur-fast) var(--ease-out),
      box-shadow var(--dur-fast) var(--ease-out);

    &:focus-visible {
      outline: none;
      border-color: $plum;
      box-shadow: 0 0 0 3px rgba(56, 44, 70, 0.12);
    }
  }

  .has-error .field__input {
    border-color: $danger;

    &:focus-visible {
      box-shadow: 0 0 0 3px rgba($danger, 0.18);
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
