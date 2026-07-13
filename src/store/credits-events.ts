/**
 * Bus de eventos "el wallet de créditos pudo cambiar".
 *
 * Existe por una razón de capas: los services son código sin React y **no pueden**
 * importar el contexto de suscripción para avisarle que una acción de IA tocó el saldo.
 * En vez de acoplarlos, emiten un evento; el `SubscriptionProvider` se suscribe y relee
 * el saldo desde el backend.
 *
 * Ventaja concreta: cuando mañana se agregue una acción de IA nueva, alcanza con emitir
 * acá y el contador se actualiza solo. Nadie tiene que acordarse de tocar la UI.
 *
 * Mismo patrón de emitter a nivel de módulo que `toast.ts`.
 */

type Listener = () => void;

const listeners = new Set<Listener>();

export const creditsEvents = {
  /** Suscribe un listener. Devuelve la función para desuscribirse. */
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * Avisa que una acción que consume créditos terminó y el saldo pudo moverse.
   *
   * Se emite SIEMPRE al finalizar (éxito o error), no solo en el éxito:
   * - Éxito → se gastaron créditos.
   * - 402 → no se gastó nada, pero confirma el saldo real (que está en el piso).
   * - Otro error → el backend **reembolsa** si la IA falla, así que el saldo puede
   *   volver a subir.
   *
   * En los tres casos el número que muestra la UI quedó dudoso. Releer del backend es
   * más barato y más honesto que intentar deducirlo.
   */
  emitWalletChanged(): void {
    for (const listener of listeners) listener();
  },
};
