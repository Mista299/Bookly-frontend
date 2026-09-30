<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import CustomerNav from '$lib/components/CustomerNav.svelte';
  import { onMount } from 'svelte';

  let { children } = $props();
  let ready = $state(false);

  onMount(() => {
    const unsub = auth.subscribe((state) => {
      if (!state.ready || state.loading) return;
      if (!state.user) {
        void goto('/login');
        return;
      }
      if (state.user.role !== 'CUSTOMER') {
        const target =
          state.user.role === 'ADMIN'
            ? '/admin'
            : state.user.role === 'PROFESSIONAL'
              ? '/professional'
              : '/login';
        void goto(target);
        return;
      }
      ready = true;
    });
    return unsub;
  });
</script>

{#if ready}
  <div class="cust-shell">
    <CustomerNav />
    <div class="cust-shell__main">
      {@render children?.()}
    </div>
  </div>
{:else}
  <div class="cust-shell__loading" aria-busy="true">
    <div class="splash-brand" aria-hidden="true">
      <span class="splash-brand__mark">B</span>
      <span class="splash-brand__text">BOOKLY</span>
    </div>
  </div>
{/if}

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .cust-shell {
    display: block;
    min-height: 100dvh;
    background: var(--bg);
    padding-left: var(--nav-width);

    @media (max-width: #{$bp-lg - 1px}) {
      padding-left: 0;
      padding-bottom: var(--nav-h);
    }
  }

  .cust-shell__main {
    padding: $space-7 $space-5 $space-10;
    max-width: var(--container-max);
    width: 100%;

    @media (min-width: #{$bp-md}) {
      padding: $space-9 $space-8 $space-11;
    }

    @media (min-width: #{$bp-xl}) {
      padding: $space-10 $space-9 $space-12;
    }
  }

  .cust-shell__loading {
    min-height: 100dvh;
    background: var(--bg);
    display: grid;
    place-items: center;
  }

  .splash-brand {
    display: inline-flex;
    align-items: center;
    gap: $space-3;
    opacity: 0.6;
    animation: pulse 1.4s ease-in-out infinite;
  }

  .splash-brand__mark {
    width: 36px;
    height: 36px;
    border-radius: $radius-sm;
    background: $plum;
    color: $white;
    display: inline-grid;
    place-items: center;
    font-family: $font-display;
    font-weight: $fw-semibold;
    font-size: 18px;
  }

  .splash-brand__text {
    font-family: $font-display;
    font-weight: $fw-semibold;
    font-size: $fs-lg;
    letter-spacing: $ls-tight;
    color: $plum;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.55; }
    50% { opacity: 0.85; }
  }
</style>