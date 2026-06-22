import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: `${number}%`;
}

/**
 * Bottom sheet simple y reutilizable para flujos internos.
 */
export function BottomSheetModal({
  visible,
  onClose,
  children,
  height = '85%',
}: BottomSheetModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        <View
          className="bg-zinc-950 rounded-t-3xl overflow-hidden"
          style={{ height, paddingBottom: insets.bottom }}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}
