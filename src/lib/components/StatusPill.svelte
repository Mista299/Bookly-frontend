<script lang="ts">
  import type { ServiceStatus } from '$lib/types/service';

  interface Props {
    status: ServiceStatus;
  }

  let { status }: Props = $props();
</script>

<span class="pill pill--{status === 'ACTIVO' ? 'activo' : 'inactivo'}">
  <span class="pill__dot" aria-hidden="true"></span>
  {status === 'ACTIVO' ? 'Activo' : 'Inactivo'}
</span>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .pill {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    font-size: $fs-xs;
    font-weight: $fw-medium;
    padding: 4px 10px;
    border-radius: $radius-pill;
    background: $ivory;
    color: $muted;
    border: 1px solid $border;
  }

  .pill__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .pill--activo {
    background: rgba(94, 159, 122, 0.1);
    color: color.adjust($success, $lightness: -8%);
    border-color: rgba(94, 159, 122, 0.2);
  }

  .pill--inactivo {
    background: $ivory;
    color: $muted;
  }
</style>