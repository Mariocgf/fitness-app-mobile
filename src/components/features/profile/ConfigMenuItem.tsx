import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface ConfigMenuItemProps {
  /** Nombre del ícono de Ionicons */
  icon: keyof typeof Ionicons.glyphMap;
  /** Texto del menú */
  label: string;
  /** Callback al presionar */
  onPress: () => void;
}

/**
 * Ítem de menú de configuración en la pantalla de perfil.
 * Muestra un ícono, el label y una flecha hacia la derecha.
 */
export default function ConfigMenuItem({
  icon,
  label,
  onPress,
}: ConfigMenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      className="flex-row items-center py-[18px] px-5 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800"
    >
      {/* Ícono */}
      <View className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-800 items-center justify-center mr-[14px]">
        <Ionicons name={icon} size={22} className="text-slate-500 dark:text-zinc-400" />
      </View>

      {/* Label */}
      <Text className="flex-1 text-base font-medium text-slate-800 dark:text-zinc-200">
        {label}
      </Text>

      {/* Flecha */}
      <Ionicons name="chevron-forward" size={20} className="text-slate-300 dark:text-zinc-600" />
    </TouchableOpacity>
  );
}
