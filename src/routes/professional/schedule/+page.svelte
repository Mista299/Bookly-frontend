<script lang="ts">
  import PageHead from '$lib/components/PageHead.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import ScheduleEditor from '$lib/components/ScheduleEditor.svelte';
  import { scheduleService } from '$lib/services/schedule';
  import { auth } from '$lib/stores/auth';
  import { toasts } from '$lib/stores/toasts';
  import { formatApiError } from '$lib/services/errors';
  import type { ScheduleSlot } from '$lib/types/schedule';
  import { onMount } from 'svelte';

  let initialSlots = $state<ScheduleSlot[]>([]);
  let loading = $state(true);

  async function load() {
    if (!$auth.user) {
      loading = false;
      return;
    }
    loading = true;
    try {
      const res = await scheduleService.get($auth.user.id);
      initialSlots = res.slots ?? [];
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 404) {
        initialSlots = [];
      } else {
        toasts.push(formatApiError(err, 'No se pudo cargar tu horario.'), 'danger');
        initialSlots = [];
      }
    } finally {
      loading = false;
    }
  }

  onMount(load);

  async function handleSave(slots: ScheduleSlot[]) {
    if (!$auth.user) return;
    try {
      const res = await scheduleService.replace($auth.user.id, { slots });
      initialSlots = res.slots ?? slots;
      toasts.push('Horario guardado.', 'success');
    } catch (err) {
      toasts.push(formatApiError(err, 'No se pudo guardar el horario.'), 'danger');
      throw err;
    }
  }
</script>

<svelte:head>
  <title>Mi horario · BOOKLY</title>
</svelte:head>

<PageHead
  eyebrow="Disponibilidad"
  title="Mi horario."
  description="Define las franjas de la semana en las que atiendes. Tus clientes solo podrán reservar dentro de estos horarios."
/>

{#if loading}
  <Skeleton lines={10} />
{:else}
  <ScheduleEditor initialSlots={initialSlots} onSave={handleSave} />
{/if}

<style lang="scss">
  @use '$lib/styles/tokens' as *;
</style>