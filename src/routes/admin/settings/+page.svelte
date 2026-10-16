<script lang="ts">
  import PageHead from '$lib/components/PageHead.svelte';
  import {
    Users,
    FileSearch,
    CalendarDays,
    Settings as SettingsIcon,
    ArrowUpRight,
    Info
  } from 'lucide-svelte';

  type LinkItem = {
    label: string;
    description: string;
    href: string;
    icon: typeof Users;
  };

  const shortcuts: LinkItem[] = [
    {
      label: 'Usuarios',
      description: 'Busca cuentas, asigna roles o restablece claves.',
      href: '/admin/users',
      icon: Users
    },
    {
      label: 'Auditoría',
      description: 'Consulta el historial de eventos del sistema.',
      href: '/admin/audit',
      icon: FileSearch
    },
    {
      label: 'Horarios por profesional',
      description: 'Abre la agenda para revisar la disponibilidad del equipo.',
      href: '/admin/agenda',
      icon: CalendarDays
    },
    {
      label: 'Calendario de plataforma',
      description: 'Visualiza reservas y eventos en un solo lugar.',
      href: '/admin/agenda',
      icon: CalendarDays
    }
  ];
</script>

<svelte:head>
  <title>Configuración · BOOKLY Administración</title>
</svelte:head>

<PageHead
  eyebrow="Ajustes"
  title="Configuración."
  description="Atajos administrativos y referencia rápida de tu plataforma BOOKLY."
/>

<section class="settings" data-od-id="admin-settings">
  <article class="settings__block">
    <header class="settings__head">
      <h2 class="settings__title">Accesos rápidos</h2>
      <p class="settings__sub">Las áreas administrativas más usadas en un solo lugar.</p>
    </header>
    <ul class="settings__list">
      {#each shortcuts as item (item.href + item.label)}
        <li>
          <a class="settings__link" href={item.href}>
            <span class="settings__icon" aria-hidden="true">
              <item.icon size={18} />
            </span>
            <span class="settings__body">
              <span class="settings__label">{item.label}</span>
              <span class="settings__desc">{item.description}</span>
            </span>
            <span class="settings__chev" aria-hidden="true">
              <ArrowUpRight size={16} />
            </span>
          </a>
        </li>
      {/each}
    </ul>
  </article>

  <article class="settings__block">
    <header class="settings__head">
      <h2 class="settings__title">Información</h2>
      <p class="settings__sub">Detalles del estado de la plataforma.</p>
    </header>
    <div class="settings__info">
      <span class="settings__info-icon" aria-hidden="true">
        <Info size={18} />
      </span>
      <div class="settings__info-body">
        <p class="settings__info-title">Configuración inicial</p>
        <p class="settings__info-text">
          La configuración inicial de la plataforma se realiza desde
          <a class="settings__info-link" href="/setup">/setup</a> solo durante el primer arranque.
          Una vez creada la cuenta administradora, esta sección queda deshabilitada.
        </p>
        <p class="settings__info-meta">
          <SettingsIcon size={12} aria-hidden="true" />
          Más ajustes estarán disponibles aquí cuando el backend exponga los endpoints necesarios.
        </p>
      </div>
    </div>
  </article>
</section>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .settings {
    display: flex;
    flex-direction: column;
    gap: $space-7;
    max-width: 760px;
  }

  .settings__head {
    margin-bottom: $space-4;
  }

  .settings__title {
    font-family: $font-display;
    font-size: $fs-xl;
    font-weight: $fw-semibold;
    letter-spacing: $ls-tight;
    color: var(--text);
    margin: 0;
  }

  .settings__sub {
    font-size: $fs-sm;
    color: $muted;
    margin: $space-2 0 0;
  }

  .settings__list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }

  .settings__link {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: $space-4;
    padding: $space-4 $space-5;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: $radius-md;
    color: var(--text);
    transition:
      border-color var(--dur-fast) var(--ease-out),
      transform var(--dur-fast) var(--ease-out),
      box-shadow var(--dur-fast) var(--ease-out);

    &:hover {
      border-color: color.adjust($border, $lightness: -10%);
      transform: translateY(-1px);
      box-shadow: $shadow-1;
    }

    &:focus-visible {
      outline: none;
      border-color: $plum;
      box-shadow: 0 0 0 3px rgba(56, 44, 70, 0.12);
    }
  }

  .settings__icon {
    width: 40px;
    height: 40px;
    border-radius: $radius-sm;
    background: $plum-soft;
    color: $plum;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .settings__body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .settings__label {
    font-weight: $fw-medium;
    color: var(--text);
  }

  .settings__desc {
    font-size: $fs-sm;
    color: $muted;
    line-height: $lh-snug;
  }

  .settings__chev {
    color: $muted;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .settings__info {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: $space-4;
    padding: $space-5;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: $radius-md;
  }

  .settings__info-icon {
    width: 40px;
    height: 40px;
    border-radius: $radius-pill;
    background: $plum-soft;
    color: $plum;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .settings__info-body {
    display: flex;
    flex-direction: column;
    gap: $space-3;
    min-width: 0;
  }

  .settings__info-title {
    margin: 0;
    font-weight: $fw-semibold;
    color: var(--text);
  }

  .settings__info-text {
    margin: 0;
    color: $muted;
    line-height: $lh-relaxed;
    font-size: $fs-sm;
  }

  .settings__info-link {
    color: $plum;
    text-decoration: underline;
    font-weight: $fw-medium;
  }

  .settings__info-meta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: $fs-xs;
    color: $muted;
  }
</style>