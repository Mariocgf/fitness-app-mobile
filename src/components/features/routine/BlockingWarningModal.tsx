import { HealthWarning, WarningLevel } from '@/src/types/routine';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

interface BlockingWarningModalProps {
  payload: { warnings: HealthWarning[]; level: WarningLevel } | null;
  onAcknowledge: () => void;
}

/**
 * Modal bloqueante para advertencias de salud de nivel alto antes de aplicar
 * un swap: lista las condiciones detectadas y exige reconocerlas para seguir.
 */
export const BlockingWarningModal: React.FC<BlockingWarningModalProps> = ({ payload, onAcknowledge }) => (
  <Modal visible={!!payload} transparent animationType="fade" onRequestClose={onAcknowledge}>
    <View className="flex-1 bg-black/70 items-center justify-center p-6">
      <View className="w-full max-w-md bg-zinc-900 rounded-3xl p-6">
        <View className="items-center mb-4">
          <View className="w-14 h-14 rounded-full bg-red-500/15 items-center justify-center mb-3">
            <Ionicons name="warning" size={30} className="text-red-500" />
          </View>
          <Text className="text-white text-xl font-bold text-center">
            Atención: condiciones de salud
          </Text>
        </View>

        <ScrollView className="mb-6 max-h-60">
          {payload?.warnings.map((w, i) => (
            <View key={i} className="mb-3">
              <Text className="text-white font-semibold text-sm mb-1">{w.condition}</Text>
              <Text className="text-zinc-400 text-xs leading-5">{w.message}</Text>
            </View>
          ))}
        </ScrollView>

        <Pressable onPress={onAcknowledge} className="py-3 rounded-2xl bg-red-500 items-center">
          <Text className="text-white font-semibold">Entendido, ver sugerencias</Text>
        </Pressable>
      </View>
    </View>
  </Modal>
);
