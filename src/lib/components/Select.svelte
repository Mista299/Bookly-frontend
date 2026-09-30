<script lang="ts">
  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    label?: string;
    value?: string;
    options: Option[];
    placeholder?: string;
    error?: string | null;
    required?: boolean;
    disabled?: boolean;
    id?: string;
    name?: string;
  }

  let {
    label,
    value = $bindable(''),
    options,
    placeholder,
    error = null,
    required = false,
    disabled = false,
    id,
    name
  }: Props = $props();

  const fieldId = $derived(id ?? `select-${Math.random().toString(36).slice(2, 8)}`);
</script>

<div class="field" class:has-error={!!error}>
  {#if label}
    <label class="field__label" for={fieldId}>
      {label}
      {#if required}<span class="field__required" aria-hidden="true">*</span>{/if}
    </label>
  {/if}
  <div class="field__wrap">
    <select
      id={fieldId}
      {name}
      {disabled}
      {required}
      bind:value
      class="field__select"
      aria-invalid={!!error}
    >
      {#if placeholder}
        <option value="" disabled>{placeholder}</option>
      {/if}
      {#each options as opt (opt.value)}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
    <svg
      class="field__chev"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </div>
  {#if error}
    <p class="field__error">{error}</p>
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
  }

  .field__required {
    color: $coral;
    margin-left: 2px;
  }

  .field__wrap {
    position: relative;
  }

  .field__select {
    appearance: none;
    width: 100%;
    min-height: var(--touch-target);
    padding: 0 $space-9 0 $space-4;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-md;
    font-size: $fs-base;
    color: $text;
    cursor: pointer;
    transition:
      border-color var(--dur-fast) var(--ease-out),
      box-shadow var(--dur-fast) var(--ease-out);

    &:focus-visible {
      outline: none;
      border-color: $plum;
      box-shadow: 0 0 0 3px rgba(56, 44, 70, 0.12);
    }
  }

  .field__chev {
    position: absolute;
    right: $space-4;
    top: 50%;
    transform: translateY(-50%);
    color: $muted;
    pointer-events: none;
  }

  .has-error .field__select {
    border-color: $danger;
  }

  .field__error {
    font-size: $fs-xs;
    color: $danger;
  }
</style>