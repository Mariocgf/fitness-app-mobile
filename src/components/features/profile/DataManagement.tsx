import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

import BackButton from '@/src/components/common/BackButton';

interface DataManagementProps {
  /** Callback para volver a la pantalla principal del perfil */
  onBack: () => void;
}

/**
 * Sub-pantalla de manejo de datos (placeholder).
 * Se completará con funcionalidad real más adelante.
 */
export default function DataManagement({ onBack }: DataManagementProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, paddingTop: insets.top }} className="bg-white dark:bg-zinc-950">
      <BackButton onPress={onBack} color="#06b6d4" label="Volver" />

      {/* Título */}
      <View className="px-8 pt-2 pb-4">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">
          Manejo de datos
        </Text>
      </View>

      {/* Placeholder */}
      <View className="flex-1 items-center justify-center px-8">
        <Ionicons name="construct-outline" size={64} className="text-slate-300 dark:text-zinc-600" />
        <Text className="text-lg font-semibold text-slate-400 dark:text-zinc-500 mt-4 text-center">
          Próximamente
        </Text>
        <Text className="text-sm text-slate-300 dark:text-zinc-600 mt-2 text-center">
          Aquí podrás gestionar tus datos personales.
        </Text>
      </View>
    </View>
  );
}
