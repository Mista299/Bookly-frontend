<script lang="ts">
  import PageHead from '$lib/components/PageHead.svelte';
</script>

<svelte:head>
  <title>Configuración · BOOKLY Administración</title>
</svelte:head>

<PageHead
  eyebrow="Ajustes"
  title="Configuración."
  description="Ajustes generales del espacio de administración."
/>

<div class="coming">
  <p class="eyebrow">Próximamente</p>
  <h2 class="coming__title">Estamos preparando esta sección.</h2>
  <p class="coming__desc">
    Aquí encontrarás los ajustes generales del sistema cuando estén disponibles desde el backend.
  </p>
</div>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .coming {
    max-width: 520px;
    padding: $space-8;
    background: $surface;
    border: 1px dashed $border;
    border-radius: $radius-lg;
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }

  .coming__title {
    font-size: $fs-xl;
    font-family: $font-display;
    color: $text;
  }

  .coming__desc {
    color: $muted;
    line-height: $lh-relaxed;
  }
</style>