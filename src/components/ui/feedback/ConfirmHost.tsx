import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { resolveConfirm, useConfirmRequest } from './confirm';

/**
 * Renderiza el diálogo de confirmación activo (si hay). Se monta una vez en el
 * layout raíz. Centrado, dark-only, coherente con el resto de la app.
 */
export function ConfirmHost() {
  const request = useConfirmRequest();
  const visible = request !== null;

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
              <Text className="mt-2 text-sm leading-5 text-zinc-400">{request.message}</Text>
            ) : null}

            <View className="mt-6 flex-row gap-3">
              <Pressable
                onPress={() => resolveConfirm(false)}
                className="flex-1 items-center justify-center rounded-2xl border border-zinc-700 py-3 active:bg-zinc-800"
              >
                <Text className="text-base font-semibold text-zinc-200">
                  {request.cancelText ?? 'Cancelar'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => resolveConfirm(true)}
                className={
                  request.destructive
                    ? 'flex-1 items-center justify-center rounded-2xl bg-red-500 py-3 active:bg-red-600'
                    : 'flex-1 items-center justify-center rounded-2xl bg-lime-300 py-3 active:bg-lime-400'
                }
              >
                <Text
                  className={
                    request.destructive
                      ? 'text-base font-semibold text-white'
                      : 'text-base font-semibold text-zinc-950'
                  }
                >
                  {request.confirmText ?? 'Aceptar'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </Modal>
  );
}
