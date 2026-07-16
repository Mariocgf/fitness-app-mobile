import { useSyncExternalStore } from 'react';

/**
 * Diálogo de confirmación in-app basado en Promise.
 *
 * Reemplaza el patrón de callbacks de `Alert.alert(title, msg, [...])`:
 *
 *   const ok = await confirm({ title, message, destructive: true });
 *   if (!ok) return;
 *
 * Igual que el toast, vive en un emitter a nivel de módulo para poder llamarse
 * desde componentes o hooks sin inyectar props. Solo hay un diálogo a la vez.
 */

export interface ConfirmOptions {
  title?: string;
  message?: string;
  /** Texto del botón de acción. Default: 'Aceptar'. */
  confirmText?: string;
  /** Texto del botón de cancelar. Default: 'Cancelar'. */
  cancelText?: string;
  /** Pinta la acción en rojo (borrados / acciones irreversibles). */
  destructive?: boolean;
  /** Diálogo informativo: un solo botón, sin "Cancelar" (no hay nada que cancelar). */
  hideCancel?: boolean;
}

export interface ConfirmRequest extends ConfirmOptions {
  id: number;
  resolve: (confirmed: boolean) => void;
}

let current: ConfirmRequest | null = null;
let counter = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function confirm(options: ConfirmOptions): Promise<boolean> {
  // Si ya hay uno abierto, lo resolvemos como cancelado antes de reemplazarlo.
  current?.resolve(false);

  return new Promise<boolean>((resolve) => {
    current = { id: ++counter, resolve, ...options };
    emit();
  });
}

/**
 * Diálogo informativo de un solo botón (el equivalente in-app de `Alert.alert(msg)`).
 *
 * Reusa el mismo host que `confirm` — no hay un modal paralelo — así que se renderiza
 * igual en nativo y en PWA, y por encima de cualquier pantalla.
 */
export function alertDialog(
  options: Omit<ConfirmOptions, 'cancelText' | 'destructive' | 'hideCancel'>,
): Promise<void> {
  return confirm({ ...options, hideCancel: true }).then(() => undefined);
}

/** Lo llama el host al tocar un botón o el backdrop. */
export function resolveConfirm(confirmed: boolean) {
  if (!current) return;
  current.resolve(confirmed);
  current = null;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return current;
}

export function useConfirmRequest(): ConfirmRequest | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
