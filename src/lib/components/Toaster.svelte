<script lang="ts">
  import { toasts } from '$lib/stores/toasts';
  import { fly } from 'svelte/transition';
  import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-svelte';
</script>

<script context="module" lang="ts">
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
        {#if t.tone === 'success'}<CheckCircle2 size={18} />
        {:else if t.tone === 'danger'}<AlertCircle size={18} />
        {:else if t.tone === 'warning'}<AlertTriangle size={18} />
        {:else}<Info size={18} />
        {/if}
      </span>
      <div class="toast__body">
        <p class="toast__msg">{t.message}</p>
        {#if t.description}<p class="toast__desc">{t.description}</p>{/if}
        {#if t.actionLabel && t.onAction}
          <button type="button" class="toast__action" onclick={() => t.onAction?.()}>
            {t.actionLabel}
          </button>
        {/if}
      </div>
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
    padding: $space-4;
    box-shadow: $shadow-2;
    pointer-events: auto;
  }

  .toast--success { border-left: 3px solid $success; }
  .toast--success .toast__icon { color: $success; }
  .toast--danger { border-left: 3px solid $danger; }
  .toast--danger .toast__icon { color: $danger; }
  .toast--warning { border-left: 3px solid $coral; }
  .toast--warning .toast__icon { color: $coral; }
  .toast--info { border-left: 3px solid $plum; }
  .toast--info .toast__icon { color: $plum; }

  .toast__icon {
    display: inline-flex;
    margin-top: 2px;
  }

  .toast__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .toast__msg {
    font-size: $fs-sm;
    color: $text;
    line-height: $lh-snug;
  }

  .toast__desc {
    font-size: $fs-xs;
    color: $muted;
    line-height: $lh-snug;
  }

  .toast__action {
    align-self: flex-start;
    margin-top: 4px;
    background: transparent;
    border: 0;
    color: $plum;
    font-size: $fs-xs;
    font-weight: $fw-semibold;
    padding: 0;
    cursor: pointer;
    text-decoration: underline;
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
