import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

import { ModalFrame } from '@/src/components/common/ModalFrame';

interface EditDayPickerModalProps {
  visible: boolean;
  availableDays: { value: string; label: string }[];
  onSelect: (value: string, label: string) => void;
  onClose: () => void;
}

/**
 * Modal selector de día (dark) del modo edición de rutina: lista los días aún
 * no agregados; al elegir uno lo añade. Si no quedan días, muestra un aviso.
 */
export const EditDayPickerModal: React.FC<EditDayPickerModalProps> = ({ visible, availableDays, onSelect, onClose }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <ModalFrame>
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
        <Pressable className="bg-zinc-900 rounded-t-3xl px-6 pt-6 pb-10">
        <View className="flex-row items-center justify-between mb-5">
          <Text className="text-xl font-bold text-white">Seleccionar día</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} className="text-zinc-400" />
          </TouchableOpacity>
        </View>
        {availableDays.map(day => (
          <Pressable
            key={day.value}
            onPress={() => onSelect(day.value, day.label)}
            className="py-4 border-b border-white/5"
          >
            <Text className="text-base font-medium text-zinc-200">{day.label}</Text>
          </Pressable>
        ))}
        {availableDays.length === 0 && (
          <Text className="text-zinc-500 text-center py-4">Ya agregaste todos los días.</Text>
        )}
      </Pressable>
      </Pressable>
    </ModalFrame>
  </Modal>
);
