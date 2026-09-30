<script lang="ts">
  interface Props {
    value: number;
    currency?: string;
  }

  let { value, currency = 'COP' }: Props = $props();

  const formatted = $derived(
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(value)
  );
</script>

<span class="amount">{formatted}</span>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .amount {
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum';
    font-weight: $fw-medium;
  }
</style>