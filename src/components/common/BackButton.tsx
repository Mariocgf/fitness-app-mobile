import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BackButtonProps {
  /** Callback al presionar */
  onPress: () => void;
  /** Color del ícono y texto */
  color: string;
  /** Texto del botón (default: 'Volver') */
  label?: string;
}

/**
 * Botón "Volver" con ícono chevron para navegación dentro de sub-pasos.
 */
export default function BackButton({
  onPress,
  color,
  label = 'Volver',
}: BackButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center px-6 pt-4 pb-2"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="chevron-back" size={22} color={color} />
      <Text style={{ color }} className="text-base font-semibold ml-1">
        {label}
      </Text>
    </TouchableOpacity>
  );
}
