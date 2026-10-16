<script lang="ts">
  interface Item {
    value: string;
    label: string;
    hint?: string;
  }

  interface Props {
    label?: string;
    items: Item[];
    selected: string[];
    placeholder?: string;
    emptyText?: string;
    helper?: string;
    error?: string | null;
    disabled?: boolean;
    onChange?: (next: string[]) => void;
  }

  let {
    label,
    items,
    selected = $bindable([]),
    placeholder = 'Buscar…',
    emptyText = 'Sin coincidencias',
    helper,
    error = null,
    disabled = false,
    onChange
  }: Props = $props();

  let query = $state('');
  let open = $state(false);

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.label.toLowerCase().includes(q));
  });

  const selectedItems = $derived(items.filter((i) => selected.includes(i.value)));

  function commit(next: string[]) {
    selected = next;
    onChange?.(next);
  }

  function toggle(value: string) {
    if (selected.includes(value)) commit(selected.filter((v) => v !== value));
    else commit([...selected, value]);
  }

  function clear() {
    query = '';
    commit([]);
    open = false;
  }
</script>

<div class="multi" class:has-error={!!error}>
  {#if label}<p class="multi__label">{label}</p>{/if}

  <div class="multi__control">
    {#each selectedItems as it (it.value)}
      <button
        type="button"
        class="multi__chip"
        onclick={() => toggle(it.value)}
        aria-label={`Quitar ${it.label}`}
      >
        <span>{it.label}</span>
        <span class="multi__chip-x" aria-hidden="true">×</span>
      </button>
    {/each}
    <input
      type="text"
      class="multi__input"
      {placeholder}
      bind:value={query}
      onfocus={() => (open = true)}
      onblur={() => setTimeout(() => (open = false), 120)}
      {disabled}
    />
  </div>

  {#if open}
    <div class="multi__menu" role="listbox">
      {#if filtered.length === 0}
        <div class="multi__empty">{emptyText}</div>
      {:else}
        {#each filtered as it (it.value)}
          {@const isSelected = selected.includes(it.value)}
          <button
            type="button"
            class="multi__option"
            class:is-selected={isSelected}
            onmousedown={(e) => e.preventDefault()}
            onclick={() => toggle(it.value)}
            role="option"
            aria-selected={isSelected}
          >
            <span class="multi__check" aria-hidden="true">{isSelected ? '✓' : ''}</span>
            <span class="multi__option-label">{it.label}</span>
            {#if it.hint}<span class="multi__hint">{it.hint}</span>{/if}
          </button>
        {/each}
      {/if}
      {#if selected.length > 0}
        <div class="multi__menu-foot">
          <button type="button" class="multi__clear" onclick={clear}>Quitar todas</button>
        </div>
      {/if}
    </div>
  {/if}

  {#if error}<p class="multi__error">{error}</p>
  {:else if helper}<p class="multi__helper">{helper}</p>{/if}
</div>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .multi {
    display: flex;
    flex-direction: column;
    gap: $space-2;
    position: relative;
  }

  .multi__label {
    font-size: $fs-sm;
    font-weight: $fw-medium;
    color: $text;
  }

  .multi__control {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: $space-2;
    padding: $space-2 $space-3;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-md;
    min-height: var(--touch-target);
    transition:
      border-color var(--dur-fast) var(--ease-out),
      box-shadow var(--dur-fast) var(--ease-out);

    &:focus-within {
      border-color: $plum;
      box-shadow: 0 0 0 3px rgba(56, 44, 70, 0.12);
    }
  }

  .multi__chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: $radius-pill;
    background: $plum-soft;
    color: $plum;
    border: 1px solid transparent;
    font-size: $fs-sm;
    font-weight: $fw-medium;
    transition: background var(--dur-fast) var(--ease-out);

    &:hover {
      background: color.adjust($plum-soft, $lightness: -4%);
    }
  }

  .multi__chip-x {
    font-size: 14px;
    line-height: 1;
    color: $plum;
  }

  .multi__input {
    flex: 1;
    min-width: 120px;
    border: 0;
    background: transparent;
    outline: none;
    font-size: $fs-base;
    color: $text;

    &::placeholder {
      color: color.adjust($muted, $lightness: 12%);
    }
  }

  .multi__menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background: $surface;
    border: 1px solid $border;
    border-radius: $radius-md;
    box-shadow: $shadow-3;
    max-height: 240px;
    overflow-y: auto;
    z-index: $z-overlay;
  }

  .multi__option {
    display: flex;
    align-items: center;
    gap: $space-3;
    padding: $space-3 $space-4;
    border: 0;
    background: transparent;
    width: 100%;
    text-align: left;
    font-size: $fs-base;
    color: $text;
    transition: background var(--dur-fast) var(--ease-out);

    &:hover {
      background: $ivory;
    }

    &.is-selected {
      background: $plum-soft;
    }
  }

  .multi__check {
    width: 18px;
    color: $plum;
    font-weight: $fw-semibold;
    font-size: $fs-md;
  }

  .multi__option-label {
    flex: 1;
  }

  .multi__hint {
    font-size: $fs-xs;
    color: $muted;
  }

  .multi__empty {
    padding: $space-4;
    font-size: $fs-sm;
    color: $muted;
    text-align: center;
  }

  .multi__menu-foot {
    border-top: 1px solid $border;
    padding: $space-2;
    display: flex;
    justify-content: flex-end;
  }

  .multi__clear {
    background: transparent;
    border: 0;
    color: $muted;
    font-size: $fs-xs;
    padding: 4px 10px;
    border-radius: $radius-sm;
    cursor: pointer;
    transition: color var(--dur-fast) var(--ease-out);

    &:hover {
      color: $danger;
    }
  }

  .has-error .multi__control {
    border-color: $danger;

    &:focus-within {
      box-shadow: 0 0 0 3px rgba(217, 107, 104, 0.18);
    }
  }

  .multi__error {
    font-size: $fs-xs;
    color: $danger;
  }

  .multi__helper {
    font-size: $fs-xs;
    color: $muted;
  }
</style>
