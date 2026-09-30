<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
  type Size = 'sm' | 'md' | 'lg';

  interface Props extends HTMLButtonAttributes {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    iconOnly?: boolean;
    children?: Snippet;
  }

  let {
    variant = 'primary',
    size = 'md',
    loading = false,
    iconOnly = false,
    type = 'button',
    disabled = false,
    children,
    class: klass = '',
    ...rest
  }: Props = $props();
</script>

<button
  {type}
  class="btn btn--{variant} btn--{size} {iconOnly ? 'btn--icon' : ''} {klass}"
  disabled={disabled || loading}
  aria-busy={loading}
  {...rest}
>
  {#if loading}
    <span class="btn__spinner" aria-hidden="true"></span>
  {/if}
  <span class="btn__content" class:is-loading={loading}>
    {@render children?.()}
  </span>
</button>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: $space-2;
    border: 1px solid transparent;
    border-radius: $radius-md;
    font-family: $font-body;
    font-weight: $fw-medium;
    line-height: 1;
    cursor: pointer;
    transition:
      background var(--dur-fast) var(--ease-out),
      color var(--dur-fast) var(--ease-out),
      border-color var(--dur-fast) var(--ease-out),
      transform var(--dur-fast) var(--ease-out);
    min-height: var(--touch-target);
    padding: 0 $space-5;
    white-space: nowrap;
    user-select: none;

    &:active:not(:disabled) {
      transform: translateY(1px);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
  }

  .btn--sm {
    min-height: 36px;
    padding: 0 $space-4;
    font-size: $fs-sm;
    border-radius: $radius-sm;
  }

  .btn--md {
    font-size: $fs-base;
  }

  .btn--lg {
    min-height: 52px;
    padding: 0 $space-6;
    font-size: $fs-md;
  }

  .btn--icon {
    padding: 0;
    width: var(--touch-target);
  }

  .btn--primary {
    background: $plum;
    color: $white;

    &:hover:not(:disabled) {
      background: color.adjust($plum, $lightness: 4%);
    }

    &:active:not(:disabled) {
      background: color.adjust($plum, $lightness: -3%);
    }
  }

  .btn--secondary {
    background: $surface;
    color: $text;
    border-color: $border;

    &:hover:not(:disabled) {
      background: $ivory;
      border-color: color.adjust($border, $lightness: -5%);
    }
  }

  .btn--ghost {
    background: transparent;
    color: $text;

    &:hover:not(:disabled) {
      background: $plum-soft;
      color: $plum;
    }
  }

  .btn--danger {
    background: $danger;
    color: $white;

    &:hover:not(:disabled) {
      background: color.adjust($danger, $lightness: 4%);
    }
  }

  .btn__content {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    transition: opacity var(--dur-fast) var(--ease-out);
  }

  .btn__content.is-loading {
    opacity: 0;
  }

  .btn__spinner {
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid currentColor;
    border-top-color: transparent;
    animation: spin 0.7s linear infinite;
  }

  .btn {
    position: relative;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>