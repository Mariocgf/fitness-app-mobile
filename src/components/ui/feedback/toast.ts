import { useSyncExternalStore } from 'react';

/**
 * Store imperativo de toasts (notificaciones no bloqueantes).
 *
 * Se maneja con un emitter a nivel de módulo en vez de Context para que
 * `toast.success(...)` funcione desde componentes, hooks o services sin tener
 * que inyectar un hook en cada call site. El `ToastHost` se suscribe y renderiza.
 */

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

/** CTA opcional del toast. Usarlo solo cuando hay una salida concreta para el usuario. */
export interface ToastAction {
  /** Texto del botón. Corto y en imperativo: "Comprar créditos", "Reintentar". */
  label: string;
  /** Handler del botón. El toast se cierra solo antes de ejecutarlo. */
  onPress: () => void;
}

export interface ToastOptions {
  /** Título opcional en negrita arriba del mensaje. Omitir si el mensaje se basta solo. */
  title?: string;
  /** Variante visual (color + ícono). Default: 'info'. */
  variant?: ToastVariant;
  /** Duración en ms antes de auto-cerrarse. 0 = no se cierra solo. Default: 3500. */
  duration?: number;
  /** Botón de acción opcional. Si lo usás, dale al usuario tiempo de tocarlo (`duration` alta o 0). */
  action?: ToastAction;
}

export interface ToastEntry extends ToastOptions {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
}

const DEFAULT_DURATION = 5000;
const MAX_VISIBLE = 3;

let entries: ToastEntry[] = [];
let counter = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function show(message: string, options: ToastOptions = {}): number {
  const id = ++counter;
  const entry: ToastEntry = {
    id,
    message,
    title: options.title,
    variant: options.variant ?? 'info',
    duration: options.duration ?? DEFAULT_DURATION,
    action: options.action,
  };

  // Mantenemos a lo sumo MAX_VISIBLE: el más viejo se descarta.
  entries = [...entries, entry].slice(-MAX_VISIBLE);
  emit();

  if (entry.duration > 0) {
    setTimeout(() => dismiss(id), entry.duration);
  }

  return id;
}

function dismiss(id: number) {
  const next = entries.filter((entry) => entry.id !== id);
  if (next.length === entries.length) return;
  entries = next;
  emit();
}

export const toast = {
  show: (message: string, options?: ToastOptions) => show(message, options),
  success: (message: string, options?: Omit<ToastOptions, 'variant'>) =>
    show(message, { ...options, variant: 'success' }),
  error: (message: string, options?: Omit<ToastOptions, 'variant'>) =>
    show(message, { ...options, variant: 'error' }),
  info: (message: string, options?: Omit<ToastOptions, 'variant'>) =>
    show(message, { ...options, variant: 'info' }),
  warning: (message: string, options?: Omit<ToastOptions, 'variant'>) =>
    show(message, { ...options, variant: 'warning' }),
  dismiss,
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return entries;
}

/** Hook interno para que el host se re-renderice ante cambios del store. */
export function useToastEntries(): ToastEntry[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
