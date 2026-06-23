import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

interface ConfirmSuggestionsModalProps {
  mode: 'standard' | 'ai' | null;
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Modal de confirmación previa a pedir sugerencias de reemplazo (swap).
 * `mode` controla la visibilidad y el estilo (estándar lime / IA púrpura).
 * No aplica cambios: solo confirma que el usuario quiere pedir candidatos.
 */
export const ConfirmSuggestionsModal: React.FC<ConfirmSuggestionsModalProps> = ({
  mode,
  count,
  onCancel,
  onConfirm,
}) => {
  const isAi = mode === 'ai';
  return (
    <Modal visible={mode !== null} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 bg-black/60 items-center justify-center p-6">
        <View className="w-full max-w-md bg-zinc-900 rounded-3xl p-6">
          <View className="items-center mb-4">
            <View
              className={`w-14 h-14 rounded-full items-center justify-center mb-3 ${
                isAi ? 'bg-purple-500/15' : 'bg-lime-500/15'
              }`}
            >
              <Ionicons
                name={isAi ? 'sparkles' : 'swap-horizontal'}
                size={28}
                className={isAi ? 'text-purple-500' : 'text-lime-500'}
              />
            </View>
            <Text className="text-white text-xl font-bold text-center">
              {isAi ? 'Sugerencias con IA' : 'Sugerencias automáticas'}
            </Text>
          </View>

          <Text className="text-zinc-400 text-sm leading-5 mb-6 text-center">
            Vas a solicitar reemplazos para{' '}
            <Text className="font-bold text-white">{count}</Text>{' '}
            {count === 1 ? 'ejercicio' : 'ejercicios'}.
            {isAi
              ? ' La IA analizará tu perfil y elegirá los mejores candidatos. No se aplican cambios todavía: vas a poder elegir el reemplazo final.'
              : ' Vamos a buscar reemplazos compatibles con tu equipamiento y condiciones de salud. No se aplican cambios todavía: vas a poder elegir el reemplazo final.'}
          </Text>

          <View className="flex-row gap-3">
            <Pressable
              onPress={onCancel}
              className="flex-1 py-3 rounded-2xl bg-zinc-800 items-center"
            >
              <Text className="text-white font-semibold">Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className={`flex-1 py-3 rounded-2xl items-center ${isAi ? 'bg-purple-500' : 'bg-lime-400'}`}
            >
              <Text className={`font-semibold ${isAi ? 'text-white' : 'text-black'}`}>
                Continuar
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
