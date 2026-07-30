import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { resolveConfirm, useConfirmRequest } from './confirm';

/**
 * Largo de label a partir del cual los botones dejan de ir en fila y se apilan.
 *
 * Dos botones `flex-1` dentro de la card (max-w-sm, p-6, gap-3) quedan en ~128 px en un
 * viewport de móvil. A 16 px semibold entran unos 12 caracteres: más que eso parte el
 * texto en dos líneas y el botón queda apretado y feo. Apilados tienen el ancho completo.
 */
const MAX_INLINE_LABEL = 12;

/**
 * Botón de acción del diálogo. `text-center` no es decorativo: `items-center` centra el
 * BLOQUE de texto, pero si el label se parte en dos líneas, las líneas de adentro quedan
 * alineadas a la izquierda. Sin esto, un label largo se ve desalineado.
 */
const ConfirmButton = ({
  label,
  onPress,
  destructive,
  fullWidth,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  fullWidth: boolean;
}) => (
  <Pressable
    onPress={onPress}
    className={`${fullWidth ? 'w-full' : 'flex-1'} items-center justify-center rounded-2xl px-3 py-3 ${
      destructive ? 'bg-red-500 active:bg-red-600' : 'bg-lime-300 active:bg-lime-400'
    }`}
  >
    <Text
      className={`text-center text-base font-semibold ${
        destructive ? 'text-white' : 'text-zinc-950'
      }`}
    >
      {label}
    </Text>
  </Pressable>
);

/**
 * Renderiza el diálogo activo (si hay). Se monta una vez en el layout raíz. Centrado,
 * dark-only, coherente con el resto de la app. Sirve para confirmaciones (dos botones)
 * y para avisos informativos (`hideCancel`: un solo botón).
 *
 * El mensaje va en un `ScrollView` acotado: los textos que vienen del backend (ej. la
 * decisión del ajuste de carga) pueden ser varios párrafos y no deben empujar los
 * botones fuera de la pantalla.
 */
export function ConfirmHost() {
  const request = useConfirmRequest();
  const visible = request !== null;

  const cancelText = request?.cancelText ?? 'Cancelar';
  const confirmText = request?.confirmText ?? 'Aceptar';
  /* Con `hideCancel` el único botón ocupa toda la fila, así que nunca hace falta apilar. */
  const stacked =
    !request?.hideCancel &&
    Math.max(cancelText.length, confirmText.length) > MAX_INLINE_LABEL;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => resolveConfirm(false)}
    >
      {request ? (
        <View className="flex-1 items-center justify-center px-8">
          <Pressable
            className="absolute inset-0 bg-black/60"
            onPress={() => resolveConfirm(false)}
          />

          <View className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            {request.title ? (
              <Text className="text-lg font-bold text-zinc-100">{request.title}</Text>
            ) : null}
            {request.message ? (
              <ScrollView
                style={{ maxHeight: 260 }}
                showsVerticalScrollIndicator={false}
                className="mt-2"
              >
                <Text className="text-sm leading-5 text-zinc-400">{request.message}</Text>
              </ScrollView>
            ) : null}

            {/* Apilado: la acción principal arriba y "cancelar" abajo (convención de los
                alerts del sistema). En fila se mantiene cancelar a la izquierda. */}
            <View className={stacked ? 'mt-6 gap-3' : 'mt-6 flex-row gap-3'}>
              {stacked && (
                <ConfirmButton
                  label={confirmText}
                  onPress={() => resolveConfirm(true)}
                  destructive={request.destructive}
                  fullWidth={stacked}
                />
              )}

              {!request.hideCancel && (
                <Pressable
                  onPress={() => resolveConfirm(false)}
                  className={`${stacked ? 'w-full' : 'flex-1'} items-center justify-center rounded-2xl border border-zinc-700 px-3 py-3 active:bg-zinc-800`}
                >
                  <Text className="text-center text-base font-semibold text-zinc-200">
                    {cancelText}
                  </Text>
                </Pressable>
              )}

              {!stacked && (
                <ConfirmButton
                  label={confirmText}
                  onPress={() => resolveConfirm(true)}
                  destructive={request.destructive}
                  fullWidth={stacked}
                />
              )}
            </View>
          </View>
        </View>
      ) : null}
    </Modal>
  );
}
