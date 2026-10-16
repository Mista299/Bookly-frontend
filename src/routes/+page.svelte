<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth';

  let redirected = false;

  $effect(() => {
    const unsub = auth.subscribe((s) => {
      if (redirected) return;
      if (!s.ready || s.loading) return;
      redirected = true;
      const role = s.user?.role;
      if (role === 'ADMIN') void goto('/admin', { replaceState: true });
      else if (role === 'PROFESSIONAL') void goto('/professional', { replaceState: true });
      else if (role === 'CUSTOMER') void goto('/customer', { replaceState: true });
      else void goto('/login', { replaceState: true });
    });
    return unsub;
  });
</script>

<div class="splash" aria-hidden="true"></div>

<style lang="scss">
  .splash {
    min-height: 100dvh;
    background: linear-gradient(180deg, $ivory 0%, color.adjust($ivory, $lightness: -2%) 100%);
  }
</style>
