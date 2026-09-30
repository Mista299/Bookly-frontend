<script lang="ts">
  interface Props {
    label?: string;
    checked?: boolean;
    disabled?: boolean;
    id?: string;
  }

  let {
    label,
    checked = $bindable(false),
    disabled = false,
    id
  }: Props = $props();

  const fieldId = $derived(id ?? `switch-${Math.random().toString(36).slice(2, 8)}`);
</script>

<label class="switch" class:is-disabled={disabled} for={fieldId}>
  <input
    id={fieldId}
    type="checkbox"
    role="switch"
    {disabled}
    bind:checked
    class="switch__input"
  />
  <span class="switch__track" aria-hidden="true">
    <span class="switch__thumb"></span>
  </span>
  {#if label}
    <span class="switch__label">{label}</span>
  {/if}
</label>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .switch {
    display: inline-flex;
    align-items: center;
    gap: $space-3;
    cursor: pointer;
    min-height: var(--touch-target);
    user-select: none;
  }

  .switch__input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .switch__track {
    position: relative;
    width: 40px;
    height: 24px;
    background: $border;
    border-radius: $radius-pill;
    transition: background var(--dur-base) var(--ease-out);
    flex-shrink: 0;
  }

  .switch__thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    background: $white;
    border-radius: 50%;
    box-shadow: $shadow-1;
    transition: transform var(--dur-base) var(--ease-out);
  }

  .switch__input:checked + .switch__track {
    background: $plum;
  }

  .switch__input:checked + .switch__track .switch__thumb {
    transform: translateX(16px);
  }

  .switch__input:focus-visible + .switch__track {
    box-shadow: 0 0 0 3px rgba(56, 44, 70, 0.15);
  }

  .switch.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .switch__label {
    font-size: $fs-base;
    color: $text;
  }
</style>