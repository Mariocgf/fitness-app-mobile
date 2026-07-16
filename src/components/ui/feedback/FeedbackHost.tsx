import React, { useEffect, useState, useSyncExternalStore } from 'react';

import { ConfirmHost } from './ConfirmHost';
import { ToastHost } from './ToastHost';

/**
 * Pila de hosts montados. Solo renderiza el ÚLTIMO (el que está más arriba).
 *
 * Existe por una limitación real de React Native: una pantalla presentada como
 * `fullScreenModal` (o cualquier `<Modal>` nativo) vive en un **view controller
 * propio, por encima del árbol raíz**. Desde ahí:
 * - el `<Modal>` del `ConfirmHost` raíz NO se puede presentar (iOS lo rechaza con
 *   "already presenting") y aparece recién cuando cerrás la pantalla de arriba;
 * - el overlay absoluto del `ToastHost` raíz queda directamente TAPADO.
 *
 * O sea: todo el feedback muere adentro de esas pantallas. La solución no es
 * mover el host ni cambiar cómo se presenta la pantalla, sino montar OTRO host
 * dentro de ella: al vivir en su árbol, su view controller es el de arriba y el
 * diálogo se presenta donde corresponde.
 *
 * Para que no se rendericen dos veces (dos diálogos, dos toasts), el host raíz se
 * apaga mientras haya uno más arriba.
 */
let hostStack: number[] = [];
let hostCounter = 0;
const listeners = new Set<() => void>();

const emit = () => {
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getTopHostId = () => (hostStack.length > 0 ? hostStack[hostStack.length - 1] : 0);

/** Registra este host en la pila y avisa si es el que tiene que renderizar. */
function useIsTopmostHost(): boolean {
  const [id] = useState(() => ++hostCounter);

  useEffect(() => {
    hostStack = [...hostStack, id];
    emit();
    return () => {
      hostStack = hostStack.filter((hostId) => hostId !== id);
      emit();
    };
  }, [id]);

  return useSyncExternalStore(subscribe, getTopHostId, getTopHostId) === id;
}

/**
 * Monta los dos hosts de feedback (toasts + diálogos) en un solo lugar.
 *
 * Va en el layout raíz Y TAMBIÉN dentro de toda pantalla que se presente por encima
 * del árbol raíz (`presentation: 'fullScreenModal'`, `<Modal>` nativo). Solo el de
 * más arriba renderiza, así que montarlo de más es seguro.
 */
export function FeedbackHost() {
  const isTopmost = useIsTopmostHost();

  if (!isTopmost) return null;

  return (
    <>
      <ConfirmHost />
      <ToastHost />
    </>
  );
}
