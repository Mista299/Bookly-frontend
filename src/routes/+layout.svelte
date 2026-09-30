<script lang="ts">
  import '$lib/styles/index.scss';
  import Toaster from '$lib/components/Toaster.svelte';
  import { auth } from '$lib/stores/auth';
  import { onMount } from 'svelte';

  let { children } = $props();

  onMount(() => {
    auth.bootstrap();
  });
</script>

{@render children?.()}
<Toaster />

