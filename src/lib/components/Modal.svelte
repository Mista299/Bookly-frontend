<script lang="ts">
  import { X } from 'lucide-svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    open: boolean;
    title?: string;
    description?: string;
    size?: 'sm' | 'md' | 'lg';
    onClose?: () => void;
    children?: Snippet;
    footer?: Snippet;
  }

  let {
    open = $bindable(false),
    title,
    description,
    size = 'md',
    onClose,
    children,
    footer
  }: Props = $props();

  function close() {
    open = false;
    onClose?.();
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) close();
  }
</script>

<svelte:window onkeydown={onKey} />

{#if open}
  <div class="modal-root" role="presentation">
    <button
      type="button"
      class="modal-backdrop"
      aria-label="Cerrar"
      onclick={close}
    ></button>
    <div
      class="modal modal--{size}"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <header class="modal__head">
        <div>
          {#if title}<h3 id="modal-title" class="modal__title">{title}</h3>{/if}
          {#if description}<p class="modal__desc">{description}</p>{/if}
        </div>
        <button
          type="button"
          class="modal__close"
          aria-label="Cerrar"
          onclick={close}
        >
          <X size={18} />
        </button>
      </header>
      <div class="modal__body">
        {@render children?.()}
      </div>
      {#if footer}
        <footer class="modal__foot">{@render footer()}</footer>
      {/if}
    </div>
  </div>
{/if}

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .modal-root {
    position: fixed;
    inset: 0;
    z-index: $z-modal;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $space-4;
  }

  .modal-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(41, 37, 45, 0.4);
    border: 0;
    cursor: pointer;
    animation: fade-in var(--dur-base) var(--ease-out);
  }

  .modal {
    position: relative;
    background: $surface;
    border-radius: $radius-lg;
    box-shadow: $shadow-3;
    width: 100%;
    max-height: calc(100dvh - 32px);
    display: flex;
    flex-direction: column;
    animation: rise var(--dur-slow) var(--ease-out);
  }

  .modal--sm {
    max-width: 380px;
  }

  .modal--md {
    max-width: 520px;
  }

  .modal--lg {
    max-width: 720px;
  }

  .modal__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: $space-4;
    padding: $space-6 $space-6 $space-4;
  }

  .modal__title {
    font-size: $fs-xl;
    margin-bottom: $space-1;
  }

  .modal__desc {
    font-size: $fs-sm;
    color: $muted;
  }

  .modal__close {
    background: transparent;
    border: 0;
    width: 36px;
    height: 36px;
    border-radius: $radius-sm;
    color: $muted;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background var(--dur-fast) var(--ease-out);

    &:hover {
      background: $ivory;
      color: $text;
    }
  }

  .modal__body {
    padding: 0 $space-6 $space-6;
    overflow-y: auto;
  }

  .modal__foot {
    padding: $space-4 $space-6 $space-6;
    display: flex;
    justify-content: flex-end;
    gap: $space-3;
    border-top: 1px solid $border;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>