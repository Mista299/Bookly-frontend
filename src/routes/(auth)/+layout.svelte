<script lang="ts">
  import { BookOpen } from 'lucide-svelte';
  import { auth } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let { children } = $props();

  onMount(() => {
    const unsub = auth.subscribe((s) => {
      if (!s.ready || s.loading) return;
      const role = s.user?.role;
      if (role === 'ADMIN') void goto('/admin', { replaceState: true });
      else if (role === 'PROFESSIONAL') void goto('/professional', { replaceState: true });
      else if (role === 'CUSTOMER') void goto('/customer', { replaceState: true });
    });
    return unsub;
  });
</script>

<div class="shell">
  <a class="shell__brand" href="/" aria-label="BOOKLY">
    <span class="shell__mark" aria-hidden="true"><BookOpen size={18} /></span>
    <span>BOOKLY</span>
  </a>
  <main class="shell__main">
    {@render children?.()}
  </main>
  <p class="shell__foot">© BOOKLY · Sistema de reservas</p>
</div>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .shell {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $space-7 $space-5;
    background: linear-gradient(180deg, $ivory 0%, color.adjust($ivory, $lightness: -2%) 100%);
    gap: $space-7;
  }

  .shell__brand {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    font-family: $font-display;
    font-weight: $fw-semibold;
    font-size: $fs-md;
    letter-spacing: $ls-tight;
  }

  .shell__mark {
    width: 28px;
    height: 28px;
    background: $plum;
    color: $white;
    border-radius: $radius-sm;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .shell__main {
    width: 100%;
    max-width: 420px;
  }

  .shell__foot {
    font-size: $fs-xs;
    color: $muted;
  }
</style>