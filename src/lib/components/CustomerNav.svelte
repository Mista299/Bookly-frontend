<script lang="ts">
  import { page } from '$app/stores';
  import { auth } from '$lib/stores/auth';
  import { Home, Search, CalendarDays, UserRound, LogOut, BookOpen } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  const items = [
    { href: '/customer', label: 'Inicio', icon: Home, exact: true },
    { href: '/customer/services', label: 'Servicios', icon: Search },
    { href: '/customer/agenda', label: 'Mi agenda', icon: CalendarDays },
    { href: '/customer/profile', label: 'Perfil', icon: UserRound }
  ];

  function isActive(href: string, exact?: boolean) {
    const path = $page.url.pathname;
    if (exact) return path === href;
    return path === href || path.startsWith(href + '/');
  }

  async function logout() {
    auth.logout();
    await goto('/login');
  }
</script>

<aside class="nav" data-od-id="customer-nav">
  <a class="nav__brand" href="/customer" aria-label="BOOKLY inicio">
    <span class="nav__brand-mark" aria-hidden="true">
      <BookOpen size={18} />
    </span>
    <span class="nav__brand-text">
      <span class="nav__brand-name">BOOKLY</span>
      <span class="nav__brand-role">Cliente</span>
    </span>
  </a>

  <nav class="nav__list" aria-label="Secciones">
    {#each items as item (item.href)}
      {@const active = isActive(item.href, item.exact)}
      <a
        href={item.href}
        class="nav__item"
        class:is-active={active}
        aria-current={active ? 'page' : undefined}
        data-od-id={`nav-link-${item.href.replace(/\//g, '-')}`}
      >
        <span class="nav__item-icon" aria-hidden="true">
          <item.icon size={18} />
        </span>
        <span class="nav__item-label">{item.label}</span>
      </a>
    {/each}
  </nav>

  {#if $auth.user}
    <div class="nav__user">
      <div class="nav__user-meta">
        <span class="nav__user-name">{$auth.user.fullName}</span>
        <span class="nav__user-email">{$auth.user.email}</span>
      </div>
      <button
        type="button"
        class="nav__logout"
        onclick={logout}
        aria-label="Cerrar sesión"
      >
        <LogOut size={16} />
      </button>
    </div>
  {/if}
</aside>

<style lang="scss">
  @use '$lib/styles/tokens' as *;

  .nav {
    display: flex;
    flex-direction: column;
    gap: $space-7;
    padding: $space-6 $space-5;
    background: $surface;
    border-right: 1px solid $border;
    height: 100dvh;
    width: var(--nav-width);
    position: fixed;
    top: 0;
    left: 0;
    overflow-y: auto;
  }

  .nav__brand {
    display: flex;
    align-items: center;
    gap: $space-3;
    padding: $space-2;
    border-radius: $radius-md;
  }

  .nav__brand-mark {
    width: 32px;
    height: 32px;
    border-radius: $radius-sm;
    background: $plum;
    color: $white;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .nav__brand-text {
    display: flex;
    flex-direction: column;
    line-height: 1.1;
  }

  .nav__brand-name {
    font-family: $font-display;
    font-weight: $fw-semibold;
    font-size: $fs-md;
    letter-spacing: $ls-tight;
  }

  .nav__brand-role {
    font-size: $fs-xs;
    color: $muted;
    letter-spacing: $ls-wide;
    text-transform: uppercase;
    margin-top: 2px;
  }

  .nav__list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: -$space-3;
  }

  .nav__item {
    display: flex;
    align-items: center;
    gap: $space-3;
    padding: $space-3;
    border-radius: $radius-md;
    color: $muted;
    font-size: $fs-base;
    font-weight: $fw-medium;
    transition:
      background var(--dur-fast) var(--ease-out),
      color var(--dur-fast) var(--ease-out);
    min-height: 40px;

    &:hover {
      background: $ivory;
      color: $text;
    }

    &.is-active {
      background: $plum-soft;
      color: $plum;
    }
  }

  .nav__item-icon {
    display: inline-flex;
    flex-shrink: 0;
  }

  .nav__user {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-3;
    padding-top: $space-5;
    border-top: 1px solid $border;
  }

  .nav__user-meta {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
    min-width: 0;
  }

  .nav__user-name {
    font-size: $fs-sm;
    font-weight: $fw-medium;
    color: $text;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .nav__user-email {
    font-size: $fs-xs;
    color: $muted;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .nav__logout {
    background: transparent;
    border: 1px solid $border;
    color: $muted;
    width: 36px;
    height: 36px;
    border-radius: $radius-sm;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &:hover {
      color: $danger;
      border-color: color.adjust($danger, $lightness: 25%);
      background: rgba(217, 107, 104, 0.06);
    }
  }

  @media (max-width: #{$bp-lg - 1px}) {
    .nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      flex-direction: row;
      align-items: center;
      justify-content: space-around;
      width: auto;
      min-height: 64px;
      padding: $space-2 $space-3;
      border-right: 0;
      border-top: 1px solid $border;
      background: $surface;
      z-index: $z-sticky;
      gap: 0;
    }

    .nav__brand,
    .nav__user {
      display: none;
    }

    .nav__list {
      flex-direction: row;
      flex: 1;
      justify-content: space-around;
      margin: 0;
    }

    .nav__item {
      flex-direction: column;
      gap: 2px;
      padding: $space-2 $space-3;
      font-size: 11px;
      min-height: 56px;
      min-width: 64px;
      justify-content: center;
    }

    .nav__item-label {
      font-size: 11px;
    }
  }
</style>