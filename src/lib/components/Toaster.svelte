<script lang="ts">
  import { toasts } from '$lib/stores/toasts';
  import { fly } from 'svelte/transition';
  import { CheckCircle2, AlertCircle, Info, X } from 'lucide-svelte';
</script>

<div class="toaster" aria-live="polite" aria-atomic="true">
  {#each $toasts as t (t.id)}
    <div
      class="toast toast--{t.tone}"
      role="status"
      in:fly={{ y: 12, duration: 200 }}
      out:fly={{ y: 12, duration: 160 }}
    >
      <span class="toast__icon" aria-hidden="true">
        {#if t.tone === 'success'}
          <CheckCircle2 size={18} />
        {:else if t.tone === 'danger'}
          <AlertCircle size={18} />
        {:else}
          <Info size={18} />
        {/if}
      </span>
      <p class="toast__msg">{t.message}</p>
      <button
        type="button"
        class="toast__close"
        aria-label="Cerrar"
        onclick={() => toasts.dismiss(t.id)}
      >
        <X size={14} />
      </button>
    </div>
  {/each}
</div>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .toaster {
    position: fixed;
    z-index: $z-toast;
    bottom: $space-6;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    gap: $space-3;
    width: min(420px, calc(100% - 32px));
    pointer-events: none;

    @media (max-width: #{$bp-lg - 1px}) {
      bottom: calc(var(--nav-h, 64px) + #{$space-4});
    }
  }

  .toast {
    display: flex;
    align-items: flex-start;
    gap: $space-3;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-md;
    padding: $space-4 $space-4;
    box-shadow: $shadow-2;
    pointer-events: auto;
  }

  .toast--success {
    border-left: 3px solid $success;
  }
  .toast--success .toast__icon {
    color: $success;
  }

  .toast--danger {
    border-left: 3px solid $danger;
  }
  .toast--danger .toast__icon {
    color: $danger;
  }

  .toast--info {
    border-left: 3px solid $plum;
  }
  .toast--info .toast__icon {
    color: $plum;
  }

  .toast__icon {
    display: inline-flex;
    margin-top: 2px;
  }

  .toast__msg {
    flex: 1;
    font-size: $fs-sm;
    color: $text;
    line-height: $lh-snug;
  }

  .toast__close {
    background: transparent;
    border: 0;
    color: $muted;
    width: 24px;
    height: 24px;
    border-radius: $radius-xs;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: $ivory;
      color: $text;
    }
  }
</style>