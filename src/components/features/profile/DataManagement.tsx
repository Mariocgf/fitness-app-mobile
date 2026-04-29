import React from 'react';
import { Text, useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
        <Ionicons
          name="construct-outline"
          size={64}
          color={isDark ? '#52525b' : '#cbd5e1'}
        />
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: isDark ? '#71717a' : '#94a3b8',
            marginTop: 16,
            textAlign: 'center',
          }}
        >
          Próximamente
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: isDark ? '#52525b' : '#cbd5e1',
            marginTop: 8,
            textAlign: 'center',
          }}
        >
          Aquí podrás gestionar tus datos personales.
        </Text>
      </View>
    </View>
  );
}
