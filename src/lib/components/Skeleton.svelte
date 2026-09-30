<script lang="ts">
  interface Props {
    lines?: number;
    avatar?: boolean;
  }

  let { lines = 3, avatar = false }: Props = $props();
</script>

<div class="skeleton" aria-busy="true" aria-live="polite">
  {#if avatar}<div class="skeleton__avatar"></div>{/if}
  <div class="skeleton__body">
    {#each Array(lines) as _, i (i)}
      <div class="skeleton__line" style="width: {i === lines - 1 ? 60 : 95 - i * 8}%"></div>
    {/each}
  </div>
</div>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .skeleton {
    display: flex;
    gap: $space-4;
    padding: $space-4;
  }

  .skeleton__avatar {
    width: 40px;
    height: 40px;
    border-radius: $radius-pill;
    background: linear-gradient(90deg, $border 0%, color.adjust($border, $lightness: 4%) 50%, $border 100%);
    background-size: 200% 100%;
    animation: shimmer 1.4s linear infinite;
  }

  .skeleton__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }

  .skeleton__line {
    height: 12px;
    border-radius: $radius-xs;
    background: linear-gradient(90deg, $border 0%, color.adjust($border, $lightness: 4%) 50%, $border 100%);
    background-size: 200% 100%;
    animation: shimmer 1.4s linear infinite;
  }

  @keyframes shimmer {
    from {
      background-position: 200% 0;
    }
    to {
      background-position: -200% 0;
    }
  }
</style>