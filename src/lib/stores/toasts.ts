import { writable, type Writable } from 'svelte/store';

export type ToastTone = 'info' | 'success' | 'danger' | 'warning';

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

function createToasts() {
  const store: Writable<Toast[]> = writable([]);

  function push(
    message: string,
    tone: ToastTone = 'info',
    timeout = 3200,
    extras: Partial<Pick<Toast, 'description' | 'actionLabel' | 'onAction'>> = {}
  ): string {
    const id = Math.random().toString(36).slice(2);
    store.update((list) => [...list, { id, tone, message, ...extras }]);
    if (timeout > 0) {
      setTimeout(() => {
        store.update((list) => list.filter((t) => t.id !== id));
      }, timeout);
    }
    return id;
  }

  function dismiss(id: string) {
    store.update((list) => list.filter((t) => t.id !== id));
  }

  function clear() {
    store.set([]);
  }

  return {
    subscribe: store.subscribe,
    push,
    dismiss,
    clear
  };
}

export const toasts = createToasts();
