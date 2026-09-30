import { writable, type Writable } from 'svelte/store';

export type ToastTone = 'info' | 'success' | 'danger';

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
}

function createToasts() {
  const store: Writable<Toast[]> = writable([]);

  function push(message: string, tone: ToastTone = 'info', timeout = 3200) {
    const id = Math.random().toString(36).slice(2);
    store.update((list) => [...list, { id, message, tone }]);
    if (timeout > 0) {
      setTimeout(() => {
        store.update((list) => list.filter((t) => t.id !== id));
      }, timeout);
    }
  }

  function dismiss(id: string) {
    store.update((list) => list.filter((t) => t.id !== id));
  }

  return {
    subscribe: store.subscribe,
    push,
    dismiss
  };
}

export const toasts = createToasts();