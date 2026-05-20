import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface SectionHeaderProps {
  title: string;
  onBack: () => void;
}

/**
 * Cabecera reutilizable para las sub-secciones del perfil.
 * Muestra botón de volver y título centrado.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, onBack }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingTop: insets.top + 8 }}
      className="flex-row items-center px-4 pb-4 border-b border-slate-100 dark:border-slate-800"
    >
      <TouchableOpacity
        onPress={onBack}
        activeOpacity={0.7}
        className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 items-center justify-center mr-3"
      >
        <Ionicons name="chevron-back" size={20} className="text-slate-700 dark:text-slate-100" />
      </TouchableOpacity>
      <Text className="flex-1 text-center text-base font-semibold text-slate-900 dark:text-slate-50 mr-10">
        {title}
      </Text>
    </View>
  );
};
